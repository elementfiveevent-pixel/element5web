-- Drop the problematic restrictive policy that blocks all profile access
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- The existing permissive policies are correct:
-- "Users can view own full profile" and "Users can view own profile" allow authenticated users to read their own profile
-- We don't need to recreate them as they already exist

-- If we want to explicitly block anonymous/public access while allowing authenticated users,
-- we can create a proper policy (but the existing ones already require auth.uid() = id)