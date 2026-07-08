CREATE OR REPLACE FUNCTION public.register_for_event_atomic(
  p_event_id UUID,
  p_user_id UUID,
  p_custom_data JSONB DEFAULT NULL,
  p_payment_screenshot_url TEXT DEFAULT NULL,
  p_group_size INTEGER DEFAULT 1,
  p_is_group_booking BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_existing RECORD;
  v_registration_id UUID;
  v_payment_status TEXT;
  v_base_amount NUMERIC;
  v_addons_amount NUMERIC;
  v_total_amount NUMERIC;
BEGIN
  SELECT id, payment_status INTO v_existing
  FROM event_registrations
  WHERE event_id = p_event_id AND user_id = p_user_id;

  IF FOUND THEN
    IF v_existing.payment_status = 'rejected' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'REGISTRATION_REJECTED',
        'message', 'Your registration was rejected. You cannot re-apply.'
      );
    END IF;
    RETURN jsonb_build_object(
      'success', true,
      'registration_id', v_existing.id,
      'already_registered', true,
      'payment_status', v_existing.payment_status,
      'message', 'You are already registered for this event!'
    );
  END IF;

  SELECT id, max_capacity, registrations_count, is_paid, status
  INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'EVENT_NOT_FOUND', 'message', 'Event not found.');
  END IF;

  IF v_event.status != 'published' THEN
    RETURN jsonb_build_object('success', false, 'error', 'EVENT_NOT_PUBLISHED', 'message', 'Event is not accepting registrations.');
  END IF;

  IF v_event.max_capacity IS NOT NULL AND (v_event.registrations_count + p_group_size) > v_event.max_capacity THEN
    RETURN jsonb_build_object('success', false, 'error', 'EVENT_FULL', 'message', 'Event is full.');
  END IF;

  IF v_event.is_paid THEN
    v_payment_status := 'pending';
  ELSE
    v_payment_status := 'approved';
  END IF;

  v_base_amount := COALESCE((p_custom_data->>'_base_amount')::NUMERIC, (p_custom_data->>'_applied_price')::NUMERIC, (p_custom_data->>'_amount')::NUMERIC);
  v_addons_amount := COALESCE((p_custom_data->>'_addons_amount')::NUMERIC, 0);
  v_total_amount := COALESCE((p_custom_data->>'_total_amount')::NUMERIC, v_base_amount);

  INSERT INTO event_registrations (event_id, user_id, custom_data, payment_screenshot_url, payment_status, group_size, is_group_booking, base_amount, addons_amount, total_amount)
  VALUES (p_event_id, p_user_id, p_custom_data, p_payment_screenshot_url, v_payment_status::ticket_status, p_group_size, p_is_group_booking, v_base_amount, v_addons_amount, v_total_amount)
  RETURNING id INTO v_registration_id;

  -- The trigger "update_event_registrations" on event_registrations already increments registrations_count on INSERT, so no manual increment needed here.

  IF NOT v_event.is_paid THEN
    INSERT INTO event_tickets (event_id, user_id, registration_id, qr_code, is_used, is_group_booking, group_size)
    VALUES (p_event_id, p_user_id, v_registration_id, gen_random_uuid()::text || replace(gen_random_uuid()::text, '-', ''), false, p_is_group_booking, p_group_size);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'already_registered', false,
    'payment_status', v_payment_status,
    'message', CASE WHEN v_event.is_paid THEN 'Registration submitted! Payment pending verification.' ELSE 'Registration confirmed! Your ticket is ready.' END
  );
END;
$$;