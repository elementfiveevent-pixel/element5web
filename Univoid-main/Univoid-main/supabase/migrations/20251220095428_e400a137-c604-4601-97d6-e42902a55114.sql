-- Enable realtime for event_registrations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;

-- Enable realtime for event_tickets table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_tickets;