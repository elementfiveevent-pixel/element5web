-- Add security columns to event_tickets for anti-fraud protection
ALTER TABLE public.event_tickets 
ADD COLUMN IF NOT EXISTS token_hash TEXT,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS used_by UUID,
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'qr',
ADD COLUMN IF NOT EXISTS abuse_flag BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scan_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scan_attempt TIMESTAMP WITH TIME ZONE;

-- Create index for token hash lookup (primary lookup method)
CREATE INDEX IF NOT EXISTS idx_event_tickets_token_hash ON public.event_tickets(token_hash);

-- Create index for abuse detection
CREATE INDEX IF NOT EXISTS idx_event_tickets_abuse ON public.event_tickets(abuse_flag) WHERE abuse_flag = true;

-- Create audit log table for check-ins
CREATE TABLE IF NOT EXISTS public.check_in_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'success', 'duplicate_attempt', 'invalid_ticket', 'abuse_detected'
  verification_method TEXT NOT NULL, -- 'qr', 'manual'
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.check_in_audit_log ENABLE ROW LEVEL SECURITY;

-- Organizers can view their event's audit logs
CREATE POLICY "Organizers can view own event audit logs"
ON public.check_in_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = check_in_audit_log.event_id 
    AND events.organizer_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- System can insert audit logs (via authenticated users who are organizers)
CREATE POLICY "Organizers can insert audit logs for their events"
ON public.check_in_audit_log
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = check_in_audit_log.event_id 
    AND events.organizer_id = auth.uid()
  )
);

-- Create function to generate secure token
CREATE OR REPLACE FUNCTION public.generate_secure_ticket_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate 32 byte random token, encode as base64url
  token := encode(gen_random_bytes(32), 'base64');
  -- Make it URL-safe
  token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function for secure check-in with atomic locking
CREATE OR REPLACE FUNCTION public.secure_check_in(
  p_qr_code TEXT,
  p_event_id UUID,
  p_organizer_id UUID,
  p_verification_method TEXT DEFAULT 'qr',
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_ticket RECORD;
  v_profile RECORD;
  v_result JSONB;
BEGIN
  -- Lock the ticket row for update to prevent race conditions
  SELECT * INTO v_ticket 
  FROM public.event_tickets 
  WHERE qr_code = p_qr_code AND event_id = p_event_id
  FOR UPDATE NOWAIT;
  
  IF NOT FOUND THEN
    -- Try token_hash lookup
    SELECT * INTO v_ticket 
    FROM public.event_tickets 
    WHERE token_hash = p_qr_code AND event_id = p_event_id
    FOR UPDATE NOWAIT;
  END IF;
  
  IF NOT FOUND THEN
    -- Log invalid attempt
    INSERT INTO public.check_in_audit_log (ticket_id, event_id, organizer_id, action, verification_method, device_fingerprint)
    SELECT gen_random_uuid(), p_event_id, p_organizer_id, 'invalid_ticket', p_verification_method, p_device_fingerprint
    WHERE EXISTS (SELECT 1 FROM public.events WHERE id = p_event_id);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_TICKET',
      'message', 'Ticket not found for this event'
    );
  END IF;
  
  -- Get attendee profile
  SELECT full_name, profile_photo_url INTO v_profile
  FROM public.profiles WHERE id = v_ticket.user_id;
  
  -- Check if already used
  IF v_ticket.is_used THEN
    -- Update scan attempts
    UPDATE public.event_tickets 
    SET scan_attempts = scan_attempts + 1,
        last_scan_attempt = now(),
        abuse_flag = CASE WHEN scan_attempts > 3 THEN true ELSE abuse_flag END
    WHERE id = v_ticket.id;
    
    -- Log duplicate attempt
    INSERT INTO public.check_in_audit_log 
    (ticket_id, event_id, organizer_id, action, verification_method, device_fingerprint, metadata)
    VALUES (
      v_ticket.id, p_event_id, p_organizer_id, 'duplicate_attempt', p_verification_method, p_device_fingerprint,
      jsonb_build_object('original_used_at', v_ticket.used_at, 'original_used_by', v_ticket.used_by)
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_USED',
      'message', 'Ticket already checked in',
      'attendee_name', COALESCE(v_profile.full_name, 'Unknown'),
      'ticket_id', v_ticket.id,
      'used_at', v_ticket.used_at,
      'used_by', v_ticket.used_by
    );
  END IF;
  
  -- Perform check-in
  UPDATE public.event_tickets
  SET 
    is_used = true,
    used_at = now(),
    used_by = p_organizer_id,
    verification_method = p_verification_method,
    device_fingerprint = COALESCE(p_device_fingerprint, device_fingerprint),
    scan_attempts = scan_attempts + 1,
    last_scan_attempt = now()
  WHERE id = v_ticket.id;
  
  -- Log success
  INSERT INTO public.check_in_audit_log 
  (ticket_id, event_id, organizer_id, action, verification_method, device_fingerprint)
  VALUES (v_ticket.id, p_event_id, p_organizer_id, 'success', p_verification_method, p_device_fingerprint);
  
  RETURN jsonb_build_object(
    'success', true,
    'attendee_name', COALESCE(v_profile.full_name, 'Unknown'),
    'ticket_id', v_ticket.id,
    'avatar_url', v_profile.profile_photo_url
  );
  
EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'CONCURRENT_SCAN',
      'message', 'Ticket being processed, please wait'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update ticket creation to use secure tokens
CREATE OR REPLACE FUNCTION public.create_secure_ticket(
  p_registration_id UUID,
  p_event_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_token TEXT;
  v_ticket_id UUID;
BEGIN
  -- Generate secure token
  v_token := public.generate_secure_ticket_token();
  
  -- Create ticket with secure token
  INSERT INTO public.event_tickets (
    registration_id,
    event_id,
    user_id,
    qr_code,
    token_hash
  ) VALUES (
    p_registration_id,
    p_event_id,
    p_user_id,
    v_token,
    encode(sha256(v_token::bytea), 'hex')
  )
  RETURNING id INTO v_ticket_id;
  
  RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;