-- Fix get_event_safe to show payment QR to all users (needed for registration)
-- Payment details should be visible to anyone viewing the event page
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
  start_date timestamp with time zone,
  end_date timestamp with time zone,
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
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
    -- Show payment QR to everyone for paid events (needed for registration)
    e.upi_qr_url,
    e.upi_vpa,
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