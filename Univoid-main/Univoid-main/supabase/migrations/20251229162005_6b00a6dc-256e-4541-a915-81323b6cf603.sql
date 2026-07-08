-- Fix secure_check_in function to not insert invalid ticket_id for audit log
-- The FK constraint on check_in_audit_log requires a valid ticket_id

CREATE OR REPLACE FUNCTION public.secure_check_in(
  p_qr_code text,
  p_event_id uuid,
  p_organizer_id uuid,
  p_verification_method text DEFAULT 'qr',
  p_device_fingerprint text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    -- Return error without inserting to audit log (no valid ticket_id)
    -- Can optionally log to a separate table for invalid attempts if needed
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
$$;