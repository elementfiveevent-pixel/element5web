-- Add registration end date to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS registration_end_date timestamp with time zone;

-- Add is_group_booking to event_registrations if not already present
-- (already added in previous migration, but ensure it exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_registrations' 
    AND column_name = 'is_group_booking'
  ) THEN
    ALTER TABLE public.event_registrations ADD COLUMN is_group_booking boolean DEFAULT false;
  END IF;
END $$;

-- Create event_delete_log table for tracking deletions
CREATE TABLE IF NOT EXISTS public.event_delete_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  event_title text NOT NULL,
  organizer_id uuid NOT NULL,
  deleted_by uuid NOT NULL,
  deleted_at timestamp with time zone NOT NULL DEFAULT now(),
  registrations_count integer DEFAULT 0,
  metadata jsonb
);

-- Enable RLS
ALTER TABLE public.event_delete_log ENABLE ROW LEVEL SECURITY;

-- Only organizer or admin can view delete logs
CREATE POLICY "Organizers can view their delete logs" ON public.event_delete_log
  FOR SELECT USING (
    auth.uid() = organizer_id OR 
    auth.uid() = deleted_by OR
    has_role(auth.uid(), 'admin')
  );

-- Create function to permanently delete event with cascade
CREATE OR REPLACE FUNCTION public.permanently_delete_event(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event RECORD;
  v_user_id uuid;
  v_reg_count integer;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NOT_AUTHENTICATED',
      'message', 'Authentication required'
    );
  END IF;
  
  -- Get event details and verify ownership
  SELECT id, title, organizer_id, registrations_count 
  INTO v_event
  FROM events
  WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_FOUND',
      'message', 'Event not found'
    );
  END IF;
  
  -- Check ownership (organizer or admin only)
  IF v_event.organizer_id != v_user_id AND NOT has_role(v_user_id, 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NOT_AUTHORIZED',
      'message', 'You can only delete your own events'
    );
  END IF;
  
  -- Log the deletion before removing
  INSERT INTO event_delete_log (event_id, event_title, organizer_id, deleted_by, registrations_count, metadata)
  VALUES (
    p_event_id, 
    v_event.title, 
    v_event.organizer_id, 
    v_user_id, 
    v_event.registrations_count,
    jsonb_build_object('deleted_at', now(), 'user_agent', current_setting('request.headers', true)::json->>'user-agent')
  );
  
  -- Delete in correct order (foreign key constraints)
  
  -- Delete check-in audit logs
  DELETE FROM check_in_audit_log WHERE event_id = p_event_id;
  
  -- Delete registration addons first (references registrations and upsells)
  DELETE FROM registration_addons 
  WHERE registration_id IN (SELECT id FROM event_registrations WHERE event_id = p_event_id);
  
  -- Delete event tickets
  DELETE FROM event_tickets WHERE event_id = p_event_id;
  
  -- Delete event registrations
  DELETE FROM event_registrations WHERE event_id = p_event_id;
  
  -- Delete event upsells
  DELETE FROM event_upsells WHERE event_id = p_event_id;
  
  -- Delete event upsell settings
  DELETE FROM event_upsell_settings WHERE event_id = p_event_id;
  
  -- Delete volunteer attendance
  DELETE FROM volunteer_attendance WHERE event_id = p_event_id;
  
  -- Delete volunteer assignments (via volunteer_roles)
  DELETE FROM volunteer_assignments 
  WHERE role_id IN (SELECT id FROM volunteer_roles WHERE event_id = p_event_id);
  
  -- Delete volunteer roles
  DELETE FROM volunteer_roles WHERE event_id = p_event_id;
  
  -- Delete volunteer invites
  DELETE FROM event_volunteer_invites WHERE event_id = p_event_id;
  
  -- Delete event form fields
  DELETE FROM event_form_fields WHERE event_id = p_event_id;
  
  -- Delete event materials
  DELETE FROM event_materials WHERE event_id = p_event_id;
  
  -- Delete event clubs
  DELETE FROM event_clubs WHERE event_id = p_event_id;
  
  -- Delete Google Sheets config
  DELETE FROM event_sheets_config WHERE event_id = p_event_id;
  
  -- Delete notifications related to this event
  DELETE FROM notifications WHERE link LIKE '%' || p_event_id::text || '%';
  
  -- Finally delete the event itself
  DELETE FROM events WHERE id = p_event_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Event permanently deleted',
    'deleted_registrations', v_event.registrations_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DELETE_FAILED',
      'message', SQLERRM
    );
END;
$$;

-- Update register_for_event_atomic to check registration_end_date
CREATE OR REPLACE FUNCTION public.register_for_event_atomic(
  p_event_id uuid, 
  p_user_id uuid, 
  p_custom_data jsonb DEFAULT NULL::jsonb, 
  p_payment_screenshot_url text DEFAULT NULL::text,
  p_group_size integer DEFAULT 1,
  p_is_group_booking boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event RECORD;
  v_existing_reg RECORD;
  v_registration_id uuid;
  v_result jsonb;
BEGIN
  -- Lock the event row to prevent race conditions
  SELECT id, max_capacity, registrations_count, is_paid, status, registration_end_date
  INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE NOWAIT;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_FOUND',
      'message', 'Event not found'
    );
  END IF;
  
  -- Check if event is published
  IF v_event.status != 'published' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_PUBLISHED',
      'message', 'This event is not accepting registrations'
    );
  END IF;
  
  -- Check registration end date
  IF v_event.registration_end_date IS NOT NULL AND now() > v_event.registration_end_date THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'REGISTRATION_CLOSED',
      'message', 'Registrations are closed for this event'
    );
  END IF;
  
  -- Check for existing registration (idempotency check)
  SELECT id, payment_status INTO v_existing_reg
  FROM event_registrations
  WHERE event_id = p_event_id AND user_id = p_user_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'registration_id', v_existing_reg.id,
      'already_registered', true,
      'payment_status', v_existing_reg.payment_status,
      'message', 'You are already registered for this event'
    );
  END IF;
  
  -- Check capacity (accounting for group size)
  IF v_event.max_capacity IS NOT NULL AND (v_event.registrations_count + p_group_size) > v_event.max_capacity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_FULL',
      'message', 'This event is full. No spots available.'
    );
  END IF;
  
  -- Create registration with group info
  INSERT INTO event_registrations (
    event_id, 
    user_id, 
    custom_data, 
    payment_screenshot_url,
    group_size,
    is_group_booking
  )
  VALUES (
    p_event_id, 
    p_user_id, 
    p_custom_data, 
    p_payment_screenshot_url,
    p_group_size,
    p_is_group_booking
  )
  RETURNING id INTO v_registration_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'already_registered', false,
    'message', CASE 
      WHEN v_event.is_paid THEN 'Registration submitted! Payment pending verification.'
      ELSE 'Registration confirmed!'
    END
  );
  
EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'CONCURRENT_REQUEST',
      'message', 'High traffic detected. Please try again in a moment.'
    );
  WHEN unique_violation THEN
    -- Race condition: another request already created registration
    SELECT id, payment_status INTO v_existing_reg
    FROM event_registrations
    WHERE event_id = p_event_id AND user_id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'registration_id', v_existing_reg.id,
      'already_registered', true,
      'payment_status', v_existing_reg.payment_status,
      'message', 'You are already registered for this event'
    );
END;
$$;