-- Fix: Allow users with approved organizer applications to create events
-- This fixes the chicken-and-egg problem where organizer role is assigned after first event
-- 
-- ISSUE: The old policy required users to have 'organizer' role before creating events,
-- but the role is only assigned AFTER creating an event (via trigger_assign_organizer_on_event_create).
-- 
-- FIX: Also allow users who have an approved organizer application to create events.

DROP POLICY IF EXISTS "Organizers can create events" ON public.events;

CREATE POLICY "Users with organizer approval can create events" ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() = organizer_id 
    AND (
      -- Allow if user already has organizer role
      has_role(auth.uid(), 'organizer') 
      -- Allow if user is admin
      OR has_role(auth.uid(), 'admin')
      -- Allow if user has an approved organizer application
      OR EXISTS (
        SELECT 1 FROM public.organizer_applications 
        WHERE user_id = auth.uid() 
        AND status = 'approved'
      )
    )
  );
