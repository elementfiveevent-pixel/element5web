-- Update the event_tickets SELECT policy to allow volunteers with appropriate roles to view tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON public.event_tickets;

CREATE POLICY "Users and volunteers can view tickets for check-in"
ON public.event_tickets
FOR SELECT
USING (
  -- User can view their own tickets
  user_id = auth.uid()
  -- Organizer can view all tickets for their events
  OR EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_tickets.event_id
    AND events.organizer_id = auth.uid()
  )
  -- Volunteers with check-in roles can view tickets
  OR EXISTS (
    SELECT 1 FROM event_volunteer_invites
    WHERE event_volunteer_invites.event_id = event_tickets.event_id
    AND event_volunteer_invites.user_id = auth.uid()
    AND event_volunteer_invites.status = 'accepted'
    AND event_volunteer_invites.role IN ('all', 'qr_checkin', 'entry')
  )
  -- Admin can view all
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Also update the UPDATE policy to allow volunteers with check-in roles
DROP POLICY IF EXISTS "Organizers can update tickets" ON public.event_tickets;

CREATE POLICY "Organizers and volunteers can update tickets for check-in"
ON public.event_tickets
FOR UPDATE
USING (
  -- Organizer can update tickets for their events
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_tickets.event_id
    AND events.organizer_id = auth.uid()
  )
  -- Volunteers with check-in roles can update tickets (for check-in)
  OR EXISTS (
    SELECT 1 FROM event_volunteer_invites
    WHERE event_volunteer_invites.event_id = event_tickets.event_id
    AND event_volunteer_invites.user_id = auth.uid()
    AND event_volunteer_invites.status = 'accepted'
    AND event_volunteer_invites.role IN ('all', 'qr_checkin', 'entry')
  )
  -- Admin can update all
  OR has_role(auth.uid(), 'admin'::app_role)
);