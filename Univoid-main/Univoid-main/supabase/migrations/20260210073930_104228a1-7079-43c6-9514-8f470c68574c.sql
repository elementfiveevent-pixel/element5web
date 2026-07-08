-- Recreate the missing trigger that sends ticket emails
DROP TRIGGER IF EXISTS on_ticket_created_send_email ON public.event_tickets;
CREATE TRIGGER on_ticket_created_send_email
  AFTER INSERT ON public.event_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_created();