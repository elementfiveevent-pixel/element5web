-- Create trigger to auto-assign organizer role on event publish
DROP TRIGGER IF EXISTS on_event_publish_assign_organizer ON public.events;
CREATE TRIGGER on_event_publish_assign_organizer
  AFTER INSERT OR UPDATE OF status ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_organizer_on_event_publish();

-- Backfill organizer roles for existing published events
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT e.organizer_id, 'organizer'::app_role
FROM public.events e
WHERE e.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = e.organizer_id AND ur.role = 'organizer'
  )
ON CONFLICT (user_id, role) DO NOTHING;