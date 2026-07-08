-- Create a function to get attendee details for organizer's events
-- This bypasses RLS on profiles since organizers need to see who registered
CREATE OR REPLACE FUNCTION public.get_event_registrations_with_profiles(p_event_id uuid)
RETURNS TABLE (
  registration_id uuid,
  user_id uuid,
  payment_status text,
  payment_screenshot_url text,
  created_at timestamptz,
  reviewed_at timestamptz,
  custom_data jsonb,
  full_name text,
  email text,
  profile_photo_url text,
  mobile_number text,
  college_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is the organizer of this event
  IF NOT EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = p_event_id 
    AND (e.organizer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this event''s registrations';
  END IF;

  RETURN QUERY
  SELECT 
    er.id as registration_id,
    er.user_id,
    er.payment_status::text,
    er.payment_screenshot_url,
    er.created_at,
    er.reviewed_at,
    er.custom_data,
    p.full_name,
    p.email,
    p.profile_photo_url,
    p.mobile_number,
    p.college_name
  FROM event_registrations er
  LEFT JOIN profiles p ON p.id = er.user_id
  WHERE er.event_id = p_event_id
  ORDER BY er.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_event_registrations_with_profiles(uuid) TO authenticated;