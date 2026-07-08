-- Function to auto-assign admin_assistant role on login if invite exists
CREATE OR REPLACE FUNCTION public.process_admin_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  invite_record RECORD;
BEGIN
  -- Get the user's email
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  -- Check for pending invite
  SELECT * INTO invite_record
  FROM public.admin_invites
  WHERE email = LOWER(user_email)
    AND status = 'pending'
    AND expires_at > now();
  
  IF FOUND THEN
    -- Assign admin_assistant role using text cast for new enum value
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin_assistant'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Mark invite as accepted
    UPDATE public.admin_invites
    SET status = 'accepted', accepted_at = now()
    WHERE id = invite_record.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to process invites on user creation
DROP TRIGGER IF EXISTS on_auth_user_process_invite ON auth.users;
CREATE TRIGGER on_auth_user_process_invite
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.process_admin_invite();