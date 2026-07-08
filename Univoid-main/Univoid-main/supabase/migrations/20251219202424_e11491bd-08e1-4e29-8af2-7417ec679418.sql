-- Check if admin_invites exists and create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_invites') THEN
    CREATE TABLE public.admin_invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      invited_by UUID NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      accepted_at TIMESTAMP WITH TIME ZONE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
    );
    
    CREATE INDEX idx_admin_invites_email ON public.admin_invites(email);
    CREATE INDEX idx_admin_invites_status ON public.admin_invites(status);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all invites" ON public.admin_invites;
DROP POLICY IF EXISTS "Admins can create invites" ON public.admin_invites;
DROP POLICY IF EXISTS "Admins can update invites" ON public.admin_invites;
DROP POLICY IF EXISTS "Admins can delete invites" ON public.admin_invites;
DROP POLICY IF EXISTS "Service role full access" ON public.admin_invites;

-- Create policy for service role (edge functions use service role)
CREATE POLICY "Service role full access"
ON public.admin_invites
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Only admins can view invites from client
CREATE POLICY "Admins can view all invites"
ON public.admin_invites
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete invites from client
CREATE POLICY "Admins can delete invites"
ON public.admin_invites
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add policies to phone_otp_codes table (was missing)
DROP POLICY IF EXISTS "Service role manages OTPs" ON public.phone_otp_codes;
CREATE POLICY "Service role manages OTPs"
ON public.phone_otp_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own OTPs" ON public.phone_otp_codes;
CREATE POLICY "Users can view own OTPs"
ON public.phone_otp_codes
FOR SELECT
TO authenticated
USING (user_id = auth.uid());