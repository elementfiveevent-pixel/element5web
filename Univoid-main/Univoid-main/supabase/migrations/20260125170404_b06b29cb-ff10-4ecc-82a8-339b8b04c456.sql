-- Create a function to notify when a ticket is created
-- This will be used by pg_net to call the edge function
CREATE OR REPLACE FUNCTION public.notify_ticket_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_user_id uuid;
BEGIN
  -- Get event and user info from the new ticket
  v_event_id := NEW.event_id;
  v_user_id := NEW.user_id;
  
  -- Insert a notification record that can be processed
  -- We'll use pg_net extension to call the edge function
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-ticket-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'ticketId', NEW.id,
      'registrationId', NEW.registration_id,
      'eventId', v_event_id,
      'userId', v_user_id,
      'qrCode', NEW.qr_code
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail ticket creation if notification fails
    RAISE WARNING 'Failed to send ticket email notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to send email when ticket is created
DROP TRIGGER IF EXISTS on_ticket_created_send_email ON public.event_tickets;
CREATE TRIGGER on_ticket_created_send_email
  AFTER INSERT ON public.event_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_created();