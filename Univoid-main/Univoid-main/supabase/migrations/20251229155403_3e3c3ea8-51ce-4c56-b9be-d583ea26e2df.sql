-- Update check_in_audit_log policies to allow volunteers

-- Drop and recreate SELECT policy
DROP POLICY IF EXISTS "Organizers can view own event audit logs" ON public.check_in_audit_log;

CREATE POLICY "Organizers and volunteers can view event audit logs"
ON public.check_in_audit_log
FOR SELECT
USING (
  -- Organizer can view their event's audit logs
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = check_in_audit_log.event_id
    AND events.organizer_id = auth.uid()
  )
  -- Volunteers with check-in roles can view
  OR EXISTS (
    SELECT 1 FROM event_volunteer_invites
    WHERE event_volunteer_invites.event_id = check_in_audit_log.event_id
    AND event_volunteer_invites.user_id = auth.uid()
    AND event_volunteer_invites.status = 'accepted'
    AND event_volunteer_invites.role IN ('all', 'qr_checkin', 'entry')
  )
  -- Admin can view all
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Drop and recreate INSERT policy
DROP POLICY IF EXISTS "Organizers can insert audit logs for their events" ON public.check_in_audit_log;

CREATE POLICY "Organizers and volunteers can insert audit logs"
ON public.check_in_audit_log
FOR INSERT
WITH CHECK (
  -- Organizer can insert for their events
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = check_in_audit_log.event_id
    AND events.organizer_id = auth.uid()
  )
  -- Volunteers with check-in roles can insert
  OR EXISTS (
    SELECT 1 FROM event_volunteer_invites
    WHERE event_volunteer_invites.event_id = check_in_audit_log.event_id
    AND event_volunteer_invites.user_id = auth.uid()
    AND event_volunteer_invites.status = 'accepted'
    AND event_volunteer_invites.role IN ('all', 'qr_checkin', 'entry')
  )
  -- Admin can insert
  OR has_role(auth.uid(), 'admin'::app_role)
);