-- Create function to assign organizer role when event is published
CREATE OR REPLACE FUNCTION public.assign_organizer_on_event_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed when event status changes to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Check if user already has organizer role
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = NEW.organizer_id AND role = 'organizer'
    ) THEN
      -- Insert organizer role for the event creator
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.organizer_id, 'organizer');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-assign organizer role on event publish
DROP TRIGGER IF EXISTS on_event_publish_assign_organizer ON public.events;
CREATE TRIGGER on_event_publish_assign_organizer
  AFTER INSERT OR UPDATE OF status ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_organizer_on_event_publish();

-- Add comment for documentation
COMMENT ON FUNCTION public.assign_organizer_on_event_publish() IS 'Automatically assigns organizer role to user when their event is published';
COMMENT ON TRIGGER on_event_publish_assign_organizer ON public.events IS 'Triggers organizer role assignment when event status becomes published';