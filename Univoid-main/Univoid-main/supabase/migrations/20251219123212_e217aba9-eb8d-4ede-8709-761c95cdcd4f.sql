-- Create a secure table for phone OTP codes that clients cannot read
CREATE TABLE public.phone_otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_active_otp UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.phone_otp_codes ENABLE ROW LEVEL SECURITY;

-- CRITICAL: No SELECT policy for anyone - only service role can read
-- This ensures OTP codes are NEVER exposed to clients

-- Allow service role to manage (via edge functions)
-- No policies = only service role with bypass can access

-- Create index for faster lookups
CREATE INDEX idx_phone_otp_user_id ON public.phone_otp_codes(user_id);
CREATE INDEX idx_phone_otp_expires ON public.phone_otp_codes(expires_at);

-- Remove OTP columns from profiles table (they should never be exposed)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_otp_code;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_otp_expires_at;

-- Create a function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM phone_otp_codes WHERE expires_at < now();
END;
$$;