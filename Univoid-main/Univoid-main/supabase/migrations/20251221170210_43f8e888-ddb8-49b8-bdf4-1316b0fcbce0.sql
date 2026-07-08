-- Fix award_xp function to prevent duplicate XP for same content
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid,
  _amount integer,
  _reason text,
  _content_type text DEFAULT NULL,
  _content_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require admin role
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can award XP';
  END IF;
  
  -- Check if XP was already awarded for this specific content
  IF _content_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.xp_transactions 
    WHERE content_id = _content_id 
    AND user_id = _user_id
    AND reason = _reason
  ) THEN
    -- Already awarded, skip
    RETURN;
  END IF;
  
  INSERT INTO public.xp_transactions (user_id, amount, reason, content_type, content_id)
  VALUES (_user_id, _amount, _reason, _content_type, _content_id);
  
  UPDATE public.profiles
  SET total_xp = total_xp + _amount
  WHERE id = _user_id;
END;
$$;

-- Create function to assign organizer role when user creates first event
CREATE OR REPLACE FUNCTION public.assign_organizer_on_first_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already has organizer role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.organizer_id 
    AND role = 'organizer'
  ) THEN
    -- Assign organizer role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.organizer_id, 'organizer');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_assign_organizer_on_event_create ON public.events;

-- Create trigger for auto-assigning organizer role
CREATE TRIGGER trigger_assign_organizer_on_event_create
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_organizer_on_first_event();