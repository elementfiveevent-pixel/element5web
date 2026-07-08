-- Function to check if user is admin or assistant (use text comparison to avoid enum commit issue)
CREATE OR REPLACE FUNCTION public.is_admin_or_assistant(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'admin_assistant')
  );
END;
$$;

-- Function to auto-assign admin_assistant role on login if invite exists
CREATE OR REPLACE FUNCTION public.process_admin_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id uuid;
BEGIN
  -- Check for pending invite matching user email
  SELECT id INTO v_invite_id
  FROM public.admin_invites
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now();
  
  IF v_invite_id IS NOT NULL THEN
    -- Assign admin_assistant role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin_assistant'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Mark invite as accepted
    UPDATE public.admin_invites
    SET status = 'accepted', accepted_at = now()
    WHERE id = v_invite_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to process invite on profile creation
DROP TRIGGER IF EXISTS on_profile_created_check_invite ON public.profiles;
CREATE TRIGGER on_profile_created_check_invite
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.process_admin_invite();