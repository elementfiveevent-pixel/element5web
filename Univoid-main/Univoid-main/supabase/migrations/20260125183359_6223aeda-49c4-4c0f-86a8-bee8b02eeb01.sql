
-- Drop and recreate the notify_ticket_created function with hardcoded URL
CREATE OR REPLACE FUNCTION public.notify_ticket_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call the edge function to send ticket email
  PERFORM net.http_post(
    url := 'https://rtvrdbbojqsrbkngnjgq.supabase.co/functions/v1/send-ticket-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dnJkYmJvanFzcmJrbmduamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjk4OTgsImV4cCI6MjA4MTY0NTg5OH0.z_JT_lu32_0MEr7rV2vgr19gO-R7NzMYt-qTQc2SBhc'
    ),
    body := jsonb_build_object(
      'ticketId', NEW.id,
      'registrationId', NEW.registration_id,
      'eventId', NEW.event_id,
      'userId', NEW.user_id,
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_ticket_created_send_email ON public.event_tickets;
CREATE TRIGGER on_ticket_created_send_email
  AFTER INSERT ON public.event_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_created();
