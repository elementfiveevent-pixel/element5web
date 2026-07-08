-- Fix gen_random_bytes error by using uuid-based approach
-- Drop and recreate the register_for_event_atomic function to use gen_random_uuid() instead

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
SET search_path TO 'public'
AS $$
DECLARE
  v_event RECORD;
  v_existing_registration RECORD;
  v_registration_id uuid;
  v_ticket_id uuid;
  v_result jsonb;
BEGIN
  -- Check for existing registration first (fast path)
  SELECT id, payment_status INTO v_existing_registration
  FROM event_registrations
  WHERE event_id = p_event_id AND user_id = p_user_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'registration_id', v_existing_registration.id,
      'already_registered', true,
      'payment_status', v_existing_registration.payment_status,
      'message', 'You are already registered for this event!'
    );
  END IF;
  
  -- Lock and check event
  SELECT id, max_capacity, registrations_count, is_paid, status, registration_end_date
  INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_FOUND',
      'message', 'Event not found'
    );
  END IF;
  
  IF v_event.status != 'published' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_PUBLISHED',
      'message', 'Event is not accepting registrations'
    );
  END IF;
  
  -- Check capacity
  IF v_event.max_capacity IS NOT NULL AND 
     (v_event.registrations_count + p_group_size) > v_event.max_capacity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_FULL',
      'message', 'Event is at full capacity'
    );
  END IF;
  
  -- Check registration deadline
  IF v_event.registration_end_date IS NOT NULL AND 
     v_event.registration_end_date < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'REGISTRATION_CLOSED',
      'message', 'Registration deadline has passed'
    );
  END IF;
  
  -- Create registration
  INSERT INTO event_registrations (
    event_id,
    user_id,
    custom_data,
    payment_screenshot_url,
    group_size,
    is_group_booking,
    payment_status
  ) VALUES (
    p_event_id,
    p_user_id,
    p_custom_data,
    p_payment_screenshot_url,
    p_group_size,
    p_is_group_booking,
    CASE WHEN v_event.is_paid THEN 'pending' ELSE 'approved' END
  )
  RETURNING id INTO v_registration_id;
  
  -- Update registrations count
  UPDATE events 
  SET registrations_count = registrations_count + p_group_size
  WHERE id = p_event_id;
  
  -- For free events, create ticket immediately using gen_random_uuid() instead of gen_random_bytes()
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
      replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
      false,
      p_is_group_booking,
      p_group_size
    )
    RETURNING id INTO v_ticket_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'ticket_id', v_ticket_id,
    'already_registered', false,
    'payment_status', CASE WHEN v_event.is_paid THEN 'pending' ELSE 'approved' END,
    'message', CASE 
      WHEN v_event.is_paid THEN 'Registration submitted! Payment pending verification.'
      ELSE 'Registration confirmed! Your ticket is ready.'
    END
  );
  
EXCEPTION
  WHEN unique_violation THEN
    -- Handle race condition
    SELECT id, payment_status INTO v_existing_registration
    FROM event_registrations
    WHERE event_id = p_event_id AND user_id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'registration_id', v_existing_registration.id,
      'already_registered', true,
      'payment_status', v_existing_registration.payment_status,
      'message', 'You are already registered for this event!'
    );
END;
$$;

-- Also fix the generate_ticket_qr function
CREATE OR REPLACE FUNCTION public.generate_ticket_qr()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
END;
$$;