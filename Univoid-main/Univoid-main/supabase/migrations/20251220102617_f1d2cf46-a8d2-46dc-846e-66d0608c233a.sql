-- Create trigger for automatic ticket creation on payment approval
CREATE TRIGGER on_registration_status_change
  AFTER INSERT OR UPDATE OF payment_status ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ticket_on_approval();

-- Add comment for documentation
COMMENT ON TRIGGER on_registration_status_change ON public.event_registrations IS 'Automatically creates ticket when payment is approved';