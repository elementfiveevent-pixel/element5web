-- Add explicit deny policy for anonymous users on profiles table
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);