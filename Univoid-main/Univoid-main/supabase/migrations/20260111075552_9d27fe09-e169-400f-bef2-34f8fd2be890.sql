-- First, drop both existing functions
DROP FUNCTION IF EXISTS public.register_for_event_atomic(uuid, uuid, jsonb, text);
DROP FUNCTION IF EXISTS public.register_for_event_atomic(uuid, uuid, jsonb, text, integer, boolean);

-- Create single unified function with optional parameters
CREATE OR REPLACE FUNCTION public.register_for_event_atomic(
  p_event_id uuid,
  p_user_id uuid,
  p_custom_data jsonb DEFAULT NULL,
  p_payment_screenshot_url text DEFAULT NULL,
  p_group_size integer DEFAULT 1,
  p_is_group_booking boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_existing_reg RECORD;
  v_registration_id uuid;
  v_ticket_id uuid;
  v_result jsonb;
  v_effective_capacity integer;
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
  
  -- Check capacity (consider group size for group bookings)
  v_effective_capacity := COALESCE(p_group_size, 1);
  IF v_event.max_capacity IS NOT NULL AND (v_event.registrations_count + v_effective_capacity) > v_event.max_capacity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_FULL',
      'message', 'This event is full. Not enough spots available.'
    );
  END IF;
  
  -- Create registration
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
  
  -- For free events, generate ticket immediately
  IF NOT v_event.is_paid THEN
    INSERT INTO event_tickets (
      event_id,
      user_id,
      registration_id,
      qr_code,
      is_used,
      is_group_booking,
      group_size
    )
    VALUES (
      p_event_id,
      p_user_id,
      v_registration_id,
      encode(gen_random_bytes(32), 'hex'),
      false,
      p_is_group_booking,
      p_group_size
    )
    RETURNING id INTO v_ticket_id;
  END IF;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'ticket_id', v_ticket_id,
    'already_registered', false,
    'message', CASE 
      WHEN v_event.is_paid THEN 'Registration submitted! Payment pending verification.'
      ELSE 'Registration confirmed! Your ticket is ready.'
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

-- Add poster_ratio column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS poster_ratio TEXT DEFAULT '4:5';

-- Add comment for documentation
COMMENT ON COLUMN public.events.poster_ratio IS 'Aspect ratio for event poster: 4:5, 1:1, or 16:9';