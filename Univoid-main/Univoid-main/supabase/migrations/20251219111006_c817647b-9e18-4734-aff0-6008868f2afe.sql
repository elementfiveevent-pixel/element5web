-- Fix the view to use SECURITY INVOKER instead of SECURITY DEFINER
DROP VIEW IF EXISTS public.leaderboard_profiles;

CREATE VIEW public.leaderboard_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  profile_photo_url,
  college_name,
  total_xp
FROM public.profiles
WHERE is_disabled = false;

-- Grant select on the view to anon and authenticated
GRANT SELECT ON public.leaderboard_profiles TO anon, authenticated;