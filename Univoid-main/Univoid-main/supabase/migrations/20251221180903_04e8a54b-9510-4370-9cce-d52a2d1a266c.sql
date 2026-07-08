-- =============================================
-- SECURITY FIX 1: OTP Rate Limiting Table
-- =============================================

-- Create table to track OTP rate limits
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  send_count INTEGER DEFAULT 0,
  verify_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now(),
  last_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (only service role should access this)
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- No RLS policies - only service role should access this table
-- This is intentional for security

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_user ON public.otp_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_window ON public.otp_rate_limits(window_start);

-- =============================================
-- SECURITY FIX 2: Secure Event Function (hide UPI details)
-- =============================================

-- Create function to get event with masked payment details
CREATE OR REPLACE FUNCTION public.get_event_safe(p_event_id uuid)
RETURNS TABLE (
  id uuid,
  organizer_id uuid,
  title text,
  description text,
  flyer_url text,
  category text,
  event_type text,
  is_location_decided boolean,
  venue_name text,
  venue_address text,
  maps_link text,
  start_date timestamptz,
  end_date timestamptz,
  is_paid boolean,
  price numeric,
  upi_qr_url text,
  upi_vpa text,
  terms_conditions text,
  custom_fields jsonb,
  max_capacity integer,
  registrations_count integer,
  status text,
  views_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_is_registered boolean;
  v_is_organizer boolean;
  v_is_admin boolean;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is the organizer
  SELECT EXISTS(
    SELECT 1 FROM events e WHERE e.id = p_event_id AND e.organizer_id = v_user_id
  ) INTO v_is_organizer;
  
  -- Check if user is admin
  SELECT has_role(v_user_id, 'admin') INTO v_is_admin;
  
  -- Check if user has registered for this event
  SELECT EXISTS(
    SELECT 1 FROM event_registrations 
    WHERE event_id = p_event_id AND user_id = v_user_id
  ) INTO v_is_registered;
  
  RETURN QUERY
  SELECT 
    e.id,
    e.organizer_id,
    e.title,
    e.description,
    e.flyer_url,
    e.category,
    e.event_type,
    e.is_location_decided,
    e.venue_name,
    e.venue_address,
    e.maps_link,
    e.start_date,
    e.end_date,
    e.is_paid,
    e.price,
    -- Only show payment details to registered users, organizer, or admin
    CASE 
      WHEN v_is_registered OR v_is_organizer OR v_is_admin
      THEN e.upi_qr_url 
      ELSE NULL 
    END as upi_qr_url,
    CASE 
      WHEN v_is_registered OR v_is_organizer OR v_is_admin
      THEN e.upi_vpa 
      ELSE NULL 
    END as upi_vpa,
    e.terms_conditions,
    e.custom_fields,
    e.max_capacity,
    e.registrations_count,
    e.status::text,
    e.views_count,
    e.created_at,
    e.updated_at
  FROM events e
  WHERE e.id = p_event_id 
    AND (e.status = 'published' OR v_is_organizer OR v_is_admin);
END;
$$;

-- =============================================
-- SECURITY FIX 4: Storage Policies for event-assets
-- =============================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Event assets are publicly accessible" ON storage.objects;

-- Flyers can be publicly accessible (marketing content)
CREATE POLICY "Flyers are publicly accessible"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-assets' 
  AND (storage.foldername(name))[2] = 'flyers'
);

-- UPI QR codes can be publicly accessible (needed for payment)
CREATE POLICY "UPI QR codes are publicly accessible"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-assets' 
  AND (storage.foldername(name))[2] = 'upi-qr'
);

-- Users can view their own payment screenshots
CREATE POLICY "Users can view own payment screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-assets'
  AND (storage.foldername(name))[2] = 'payments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Organizers can view payment screenshots for their events
CREATE POLICY "Organizers can view event payment screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-assets'
  AND (storage.foldername(name))[2] = 'payments'
  AND EXISTS (
    SELECT 1 FROM events e
    WHERE e.organizer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM event_registrations r 
      WHERE r.event_id = e.id 
      AND r.payment_screenshot_url LIKE '%' || storage.filename(name)
    )
  )
);

-- Users can view their own organizer proofs
CREATE POLICY "Users can view own organizer proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-assets'
  AND (storage.foldername(name))[1] = 'organizer-proofs'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Admins can view all event assets
CREATE POLICY "Admins can view all event assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-assets'
  AND has_role(auth.uid(), 'admin')
);