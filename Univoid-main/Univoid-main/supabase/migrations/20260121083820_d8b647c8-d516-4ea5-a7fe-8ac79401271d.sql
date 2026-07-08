-- Update register_for_event_atomic function to save payment amounts from custom_data
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
AS $function$
DECLARE
  v_event RECORD;
  v_existing_registration RECORD;
  v_registration_id UUID;
  v_ticket_id UUID;
  v_payment_status ticket_status;
  v_qr_code TEXT;
  v_base_amount NUMERIC;
  v_addons_amount NUMERIC;
  v_total_amount NUMERIC;
BEGIN
  -- Check for existing registration first (idempotent)
  SELECT id, payment_status INTO v_existing_registration
  FROM event_registrations
  WHERE event_id = p_event_id AND user_id = p_user_id
  LIMIT 1;
  
  IF v_existing_registration IS NOT NULL THEN
    -- Already registered - return success with existing data
    RETURN jsonb_build_object(
      'success', true,
      'registration_id', v_existing_registration.id,
      'already_registered', true,
      'payment_status', v_existing_registration.payment_status::text,
      'message', 'You''re already registered for this event!'
    );
  END IF;

  -- Lock the event row to prevent race conditions
  SELECT id, max_capacity, registrations_count, is_paid, status, registration_end_date
  INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  IF v_event IS NULL THEN
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

  -- Check registration deadline
  IF v_event.registration_end_date IS NOT NULL AND v_event.registration_end_date < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'REGISTRATION_CLOSED',
      'message', 'Registration deadline has passed'
    );
  END IF;

  -- Check capacity
  IF v_event.max_capacity IS NOT NULL AND 
     (v_event.registrations_count + p_group_size) > v_event.max_capacity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_FULL',
      'message', 'Event is full'
    );
  END IF;

  -- Determine payment status: FREE events get 'approved', PAID events get 'pending'
  IF v_event.is_paid = true THEN
    v_payment_status := 'pending'::ticket_status;
  ELSE
    v_payment_status := 'approved'::ticket_status;
  END IF;

  -- Extract payment amounts from custom_data
  v_base_amount := COALESCE(
    (p_custom_data->>'_base_amount')::numeric,
    (p_custom_data->>'_applied_price')::numeric,
    (p_custom_data->>'_amount')::numeric,
    NULL
  );
  v_addons_amount := COALESCE(
    (p_custom_data->>'_addons_amount')::numeric,
    0
  );
  v_total_amount := COALESCE(
    (p_custom_data->>'_total_amount')::numeric,
    NULL
  );

  -- Generate unique QR code
  v_qr_code := gen_random_uuid()::text || replace(gen_random_uuid()::text, '-', '');

  -- Insert registration with payment amounts and ON CONFLICT to handle race conditions
  INSERT INTO event_registrations (
    event_id,
    user_id,
    custom_data,
    payment_screenshot_url,
    payment_status,
    group_size,
    is_group_booking,
    base_amount,
    addons_amount,
    total_amount
  )
  VALUES (
    p_event_id,
    p_user_id,
    p_custom_data,
    p_payment_screenshot_url,
    v_payment_status,
    p_group_size,
    p_is_group_booking,
    v_base_amount,
    COALESCE(v_addons_amount, 0),
    v_total_amount
  )
  ON CONFLICT (event_id, user_id) DO NOTHING
  RETURNING id INTO v_registration_id;

  -- If no row was inserted, it means concurrent insert happened
  IF v_registration_id IS NULL THEN
    SELECT id, payment_status INTO v_existing_registration
    FROM event_registrations
    WHERE event_id = p_event_id AND user_id = p_user_id
    LIMIT 1;
    
    RETURN jsonb_build_object(
      'success', true,
      'registration_id', v_existing_registration.id,
      'already_registered', true,
      'payment_status', v_existing_registration.payment_status::text,
      'message', 'You''re already registered for this event!'
    );
  END IF;

  -- Update registrations count
  UPDATE events 
  SET registrations_count = registrations_count + p_group_size
  WHERE id = p_event_id;

  -- For FREE events, create ticket immediately
  IF v_event.is_paid = false THEN
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
      v_qr_code,
      false,
      p_is_group_booking,
      p_group_size
    )
    ON CONFLICT (registration_id) DO NOTHING
    RETURNING id INTO v_ticket_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'ticket_id', v_ticket_id,
    'already_registered', false,
    'payment_status', v_payment_status::text,
    'message', CASE WHEN v_event.is_paid THEN 'Registration submitted! Payment pending verification.' ELSE 'Registration confirmed! Your ticket is ready.' END
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Handle any remaining race conditions gracefully
    SELECT id, payment_status INTO v_existing_registration
    FROM event_registrations
    WHERE event_id = p_event_id AND user_id = p_user_id
    LIMIT 1;
    
    RETURN jsonb_build_object(
      'success', true,
      'registration_id', v_existing_registration.id,
      'already_registered', true,
      'payment_status', v_existing_registration.payment_status::text,
      'message', 'You''re already registered for this event!'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UNKNOWN',
      'message', SQLERRM
    );
END;
$function$;