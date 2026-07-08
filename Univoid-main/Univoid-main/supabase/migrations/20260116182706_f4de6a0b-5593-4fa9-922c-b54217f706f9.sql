-- Allow anonymous users to insert error logs (critical for error handling to work before auth)
-- This prevents 401 errors from crashing the error boundary

CREATE POLICY "Allow anonymous insert error logs"
ON public.error_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- Also ensure the existing authenticated policy uses WITH CHECK properly
-- (The existing policy is fine, this just adds anon support)