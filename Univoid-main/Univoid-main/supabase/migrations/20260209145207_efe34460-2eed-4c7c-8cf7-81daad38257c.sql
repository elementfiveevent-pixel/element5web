
-- Ticket Categories: organizer-defined ticket types per event
CREATE TABLE public.ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  max_per_user INT NOT NULL DEFAULT 10,
  max_total INT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ticket Attendees: individual attendee info per ticket in a registration
CREATE TABLE public.ticket_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  ticket_category_id UUID NOT NULL REFERENCES public.ticket_categories(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_mobile TEXT,
  ticket_id UUID REFERENCES public.event_tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attendees ENABLE ROW LEVEL SECURITY;

-- Ticket Categories: anyone can read (public event info), organizers can manage
CREATE POLICY "Anyone can view ticket categories"
  ON public.ticket_categories FOR SELECT
  USING (true);

CREATE POLICY "Organizers can insert ticket categories"
  ON public.ticket_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = ticket_categories.event_id
        AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update ticket categories"
  ON public.ticket_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = ticket_categories.event_id
        AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete ticket categories"
  ON public.ticket_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = ticket_categories.event_id
        AND events.organizer_id = auth.uid()
    )
  );

-- Ticket Attendees: users can manage their own, organizers can view all for their events
CREATE POLICY "Users can view their own attendees"
  ON public.ticket_attendees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations
      WHERE event_registrations.id = ticket_attendees.registration_id
        AND event_registrations.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.event_registrations
      JOIN public.events ON events.id = event_registrations.event_id
      WHERE event_registrations.id = ticket_attendees.registration_id
        AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attendees for their registrations"
  ON public.ticket_attendees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_registrations
      WHERE event_registrations.id = ticket_attendees.registration_id
        AND event_registrations.user_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX idx_ticket_categories_event ON public.ticket_categories(event_id);
CREATE INDEX idx_ticket_attendees_registration ON public.ticket_attendees(registration_id);
CREATE INDEX idx_ticket_attendees_category ON public.ticket_attendees(ticket_category_id);

-- Timestamp trigger for ticket_categories
CREATE TRIGGER update_ticket_categories_updated_at
  BEFORE UPDATE ON public.ticket_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
