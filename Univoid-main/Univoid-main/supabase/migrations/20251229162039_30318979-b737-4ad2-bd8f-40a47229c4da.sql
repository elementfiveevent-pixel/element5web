-- Add RLS policy for otp_rate_limits table (internal rate limiting)
-- This table should only be accessed by the user who owns the rate limit record

CREATE POLICY "Users can view own rate limits"
ON public.otp_rate_limits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate limits"
ON public.otp_rate_limits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rate limits"
ON public.otp_rate_limits
FOR UPDATE
USING (auth.uid() = user_id);