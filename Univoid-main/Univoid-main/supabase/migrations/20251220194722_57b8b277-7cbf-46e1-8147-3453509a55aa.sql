-- Add INSERT policy for profiles table
-- Users must be able to insert their own profile on first sign-in

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also add a policy for the service role trigger (handle_new_user function)
-- The trigger uses SECURITY DEFINER so it should work, but let's ensure it's solid

-- Drop and recreate a more permissive policy for authenticated users
-- This ensures Google OAuth flow works correctly
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);