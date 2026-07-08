-- Add INSERT policy for notifications table
-- This allows authenticated users to create notifications for other users
-- This is needed for features like volunteer invites, project invites, etc.
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow service role to insert (for edge functions)
-- The service role bypasses RLS by default, but explicit policy is cleaner