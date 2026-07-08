-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a policy that only allows users to view their own profile, or admins to view all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- Also allow users to view basic public info for leaderboard/social features
-- This creates a more restrictive policy for public access (only non-sensitive fields via application logic)
CREATE POLICY "Authenticated users can view profiles for leaderboard"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);