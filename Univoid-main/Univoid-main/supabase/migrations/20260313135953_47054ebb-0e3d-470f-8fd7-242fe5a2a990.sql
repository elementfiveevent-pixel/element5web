-- Remove duplicate trigger
DROP TRIGGER IF EXISTS on_registration_status_change ON public.event_registrations;

-- Update create_ticket_on_approval to handle multiple attendees
CREATE OR REPLACE FUNCTION public.create_ticket_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_attendee RECORD;
  v_has_attendees boolean;
  v_new_qr text;
  v_new_ticket_id uuid;
BEGIN
  -- Only create tickets when payment is approved (or for free events on INSERT)
  IF NEW.payment_status = 'approved' OR (
    TG_OP = 'INSERT' AND (SELECT NOT is_paid FROM public.events WHERE id = NEW.event_id)
  ) THEN
    -- Check if there are attendees in ticket_attendees table
    SELECT EXISTS (
      SELECT 1 FROM public.ticket_attendees WHERE registration_id = NEW.id
    ) INTO v_has_attendees;

    IF v_has_attendees THEN
      -- Create a ticket for each attendee that doesn't have one yet
      FOR v_attendee IN
        SELECT id, attendee_name, attendee_email
        FROM public.ticket_attendees
        WHERE registration_id = NEW.id AND ticket_id IS NULL
      LOOP
        v_new_qr := public.generate_ticket_qr();
        
        INSERT INTO public.event_tickets (
          registration_id, event_id, user_id, qr_code,
          is_group_booking, group_size
        ) VALUES (
          NEW.id, NEW.event_id, NEW.user_id, v_new_qr,
          true, 1
        )
        RETURNING id INTO v_new_ticket_id;

        -- Link ticket back to attendee
        UPDATE public.ticket_attendees
        SET ticket_id = v_new_ticket_id, qr_code = v_new_qr
        WHERE id = v_attendee.id;
      END LOOP;
    ELSE
      -- No attendees table entries: create single ticket (legacy flow)
      IF NOT EXISTS (
        SELECT 1 FROM public.event_tickets WHERE registration_id = NEW.id
      ) THEN
        INSERT INTO public.event_tickets (
          registration_id, event_id, user_id, qr_code
        ) VALUES (
          NEW.id, NEW.event_id, NEW.user_id, public.generate_ticket_qr()
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;