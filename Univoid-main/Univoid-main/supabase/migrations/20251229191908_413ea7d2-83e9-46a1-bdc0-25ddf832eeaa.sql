-- Add critical indexes for high-load performance
-- Event registrations indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_user ON event_registrations(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_status ON event_registrations(event_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_created_at ON event_registrations(created_at DESC);

-- Event tickets indexes
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_user ON event_tickets(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_qr_code ON event_tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_used ON event_tickets(event_id, is_used);

-- Events indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status_start_date ON events(status, start_date);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);

-- Volunteer invites indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_invites_event_status ON event_volunteer_invites(event_id, status);
CREATE INDEX IF NOT EXISTS idx_volunteer_invites_user_status ON event_volunteer_invites(user_id, status);

-- Volunteer attendance indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_attendance_event ON volunteer_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_attendance_user ON volunteer_attendance(user_id);

-- Add unique constraint to prevent duplicate registrations (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_event_user_registration') THEN
        ALTER TABLE event_registrations 
        ADD CONSTRAINT unique_event_user_registration UNIQUE (event_id, user_id);
    END IF;
END $$;

-- Create function for atomic seat check and registration
CREATE OR REPLACE FUNCTION public.register_for_event_atomic(
  p_event_id uuid,
  p_user_id uuid,
  p_custom_data jsonb DEFAULT NULL,
  p_payment_screenshot_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_event RECORD;
  v_existing_reg RECORD;
  v_registration_id uuid;
  v_result jsonb;
BEGIN
  -- Lock the event row to prevent race conditions
  SELECT id, max_capacity, registrations_count, is_paid, status
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
  
  -- Check capacity
  IF v_event.max_capacity IS NOT NULL AND v_event.registrations_count >= v_event.max_capacity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_FULL',
      'message', 'This event is full. No spots available.'
    );
  END IF;
  
  -- Create registration
  INSERT INTO event_registrations (event_id, user_id, custom_data, payment_screenshot_url)
  VALUES (p_event_id, p_user_id, p_custom_data, p_payment_screenshot_url)
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