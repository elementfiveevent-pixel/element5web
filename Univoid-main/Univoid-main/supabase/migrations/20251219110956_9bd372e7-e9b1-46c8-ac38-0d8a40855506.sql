-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles for leaderboard" ON public.profiles;

-- Create a view for public leaderboard data (non-sensitive fields only)
CREATE OR REPLACE VIEW public.leaderboard_profiles AS
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

-- Create restrictive policy: users can only view their own full profile or admins can view all
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
);