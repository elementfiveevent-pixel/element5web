-- Create function to auto-assign organizer role when profile is created
CREATE OR REPLACE FUNCTION public.assign_organizer_role_on_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert organizer role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'organizer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-assign role after organizer profile creation
DROP TRIGGER IF EXISTS trigger_assign_organizer_role ON public.organizer_profiles;
CREATE TRIGGER trigger_assign_organizer_role
  AFTER INSERT ON public.organizer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_organizer_role_on_profile_creation();

-- Backfill: Add organizer role for users who already have organizer profiles but missing roles
INSERT INTO public.user_roles (user_id, role)
SELECT op.user_id, 'organizer'::public.app_role
FROM public.organizer_profiles op
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = op.user_id AND ur.role = 'organizer'
)
ON CONFLICT (user_id, role) DO NOTHING;