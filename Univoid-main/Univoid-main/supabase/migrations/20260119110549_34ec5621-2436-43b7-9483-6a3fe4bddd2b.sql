-- Fix register_for_event_atomic function to properly cast ENUM types
-- and handle FREE events by setting payment_status = 'approved' directly

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
  v_event record;
  v_existing_reg record;
  v_registration_id uuid;
  v_ticket_id uuid;
  v_payment_status ticket_status;
  v_spots_needed integer;
BEGIN
  -- Lock the event row to prevent race conditions
  SELECT id, max_capacity, registrations_count, is_paid, status, registration_end_date, price
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

  -- Check if event is published
  IF v_event.status <> 'published' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_PUBLISHED',
      'message', 'Event is not accepting registrations'
    );
  END IF;

  -- Check registration deadline
  IF v_event.registration_end_date IS NOT NULL AND v_event.registration_end_date < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'REGISTRATION_CLOSED',
      'message', 'Registration deadline has passed'
    );
  END IF;

  -- Check for existing registration
  SELECT id, payment_status INTO v_existing_reg
  FROM event_registrations
  WHERE event_id = p_event_id AND user_id = p_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'registration_id', v_existing_reg.id,
      'already_registered', true,
      'payment_status', v_existing_reg.payment_status::text,
      'message', 'Already registered for this event'
    );
  END IF;

  -- Calculate spots needed
  v_spots_needed := COALESCE(p_group_size, 1);

  -- Check capacity
  IF v_event.max_capacity IS NOT NULL THEN
    IF (v_event.registrations_count + v_spots_needed) > v_event.max_capacity THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'EVENT_FULL',
        'message', 'Event is at full capacity'
      );
    END IF;
  END IF;

  -- Determine payment_status based on event type
  -- For FREE events (is_paid = false OR price = 0), auto-approve
  -- For PAID events, set to pending
  IF v_event.is_paid = false OR COALESCE(v_event.price, 0) = 0 THEN
    v_payment_status := 'approved'::ticket_status;
  ELSE
    v_payment_status := 'pending'::ticket_status;
  END IF;

  -- Create registration with proper ENUM casting
  INSERT INTO event_registrations (
    event_id,
    user_id,
    custom_data,
    payment_screenshot_url,
    payment_status,
    group_size,
    is_group_booking
  ) VALUES (
    p_event_id,
    p_user_id,
    p_custom_data,
    p_payment_screenshot_url,
    v_payment_status,
    COALESCE(p_group_size, 1),
    COALESCE(p_is_group_booking, false)
  )
  RETURNING id INTO v_registration_id;

  -- Update registrations count
  UPDATE events 
  SET registrations_count = registrations_count + v_spots_needed
  WHERE id = p_event_id;

  -- For FREE events, create ticket immediately
  IF v_event.is_paid = false OR COALESCE(v_event.price, 0) = 0 THEN
    INSERT INTO event_tickets (
      event_id,
      user_id,
      registration_id,
      qr_code,
      is_used,
      is_group_booking,
      group_size
    ) VALUES (
      p_event_id,
      p_user_id,
      v_registration_id,
      gen_random_uuid()::text || replace(gen_random_uuid()::text, '-', ''),
      false,
      COALESCE(p_is_group_booking, false),
      COALESCE(p_group_size, 1)
    )
    RETURNING id INTO v_ticket_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'ticket_id', v_ticket_id,
    'already_registered', false,
    'payment_status', v_payment_status::text,
    'message', CASE 
      WHEN v_event.is_paid = false OR COALESCE(v_event.price, 0) = 0 
      THEN 'Registration confirmed! Your ticket is ready.'
      ELSE 'Registration submitted! Payment pending verification.'
    END
  );
END;
$$;

-- Grant execute permission to authenticated users and anon (for RPC access)
GRANT EXECUTE ON FUNCTION public.register_for_event_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_for_event_atomic TO anon;
GRANT EXECUTE ON FUNCTION public.register_for_event_atomic TO service_role;