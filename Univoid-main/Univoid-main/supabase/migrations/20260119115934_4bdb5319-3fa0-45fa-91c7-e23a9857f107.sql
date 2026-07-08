-- =====================================================
-- FIX OVERLY PERMISSIVE RLS POLICIES
-- This migration replaces USING(true) / WITH CHECK(true)
-- on INSERT/UPDATE/DELETE operations with proper auth checks
-- =====================================================

-- 1. Fix admin_invites: "Service role full access" policy
-- This policy is problematic - it allows ALL operations with true
-- We need to remove it and rely on specific admin-only policies
DROP POLICY IF EXISTS "Service role full access" ON admin_invites;

-- Create proper INSERT policy for admins
CREATE POLICY "Admins can create invites"
ON admin_invites FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create proper UPDATE policy for admins  
CREATE POLICY "Admins can update invites"
ON admin_invites FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix contact_messages: "Anyone can create contact messages"
-- This should require at least some validation (not blank checks)
-- For a contact form, we'll allow authenticated users OR anonymous with valid input
DROP POLICY IF EXISTS "Anyone can create contact messages" ON contact_messages;

-- Allow any user (including anonymous) to create contact messages
-- but validate that the message is being created (no data injection)
CREATE POLICY "Anyone can submit contact messages"
ON contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Basic validation: name, email, and message must be provided
  name IS NOT NULL AND 
  email IS NOT NULL AND 
  message IS NOT NULL AND
  length(name) > 0 AND
  length(email) > 0 AND
  length(message) > 0
);

-- 3. Fix error_logs: Two INSERT policies with WITH CHECK (true)
DROP POLICY IF EXISTS "Allow anonymous insert error logs" ON error_logs;
DROP POLICY IF EXISTS "Authenticated users can insert error logs" ON error_logs;

-- Create a single policy that allows error logging but validates the error data
CREATE POLICY "Anyone can log errors with valid data"
ON error_logs FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Validate that error_type and error_message are provided
  error_type IS NOT NULL AND
  error_message IS NOT NULL AND
  length(error_type) > 0 AND
  length(error_message) > 0
);

-- 4. Fix notifications: "Authenticated users can create notifications"
-- This should validate that users can only create notifications for themselves OR
-- the system/admins can create for any user
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- Users can create notifications for themselves only
CREATE POLICY "Users can create own notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only create notifications for themselves
  auth.uid() = user_id
);

-- Admins can create notifications for any user
CREATE POLICY "Admins can create notifications for anyone"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'admin_assistant'::app_role)
);

-- 5. Fix phone_otp_codes: "Service role manages OTPs"
-- This is dangerous - allows any operation. Should be restricted to user's own OTPs
DROP POLICY IF EXISTS "Service role manages OTPs" ON phone_otp_codes;

-- Users can insert their own OTP codes
CREATE POLICY "Users can insert own OTPs"
ON phone_otp_codes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own OTP codes (for verification attempts)
CREATE POLICY "Users can update own OTPs"
ON phone_otp_codes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own expired/used OTPs
CREATE POLICY "Users can delete own OTPs"
ON phone_otp_codes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);