-- Remove the unique constraint on registration_id to allow multiple tickets per registration (group bookings)
ALTER TABLE public.event_tickets DROP CONSTRAINT event_tickets_registration_id_key;

-- Add an index for performance (non-unique)
CREATE INDEX IF NOT EXISTS idx_event_tickets_registration_id ON public.event_tickets(registration_id);