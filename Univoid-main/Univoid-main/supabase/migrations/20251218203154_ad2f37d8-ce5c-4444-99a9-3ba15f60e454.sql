-- Add verification fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_otp_code text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS phone_otp_expires_at timestamp with time zone DEFAULT NULL;

-- Add new material fields: course, branch, subject, language, college
ALTER TABLE public.materials
ADD COLUMN IF NOT EXISTS course text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS branch text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subject text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS language text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS college text DEFAULT NULL;

-- Create unique index to prevent duplicate reports from same user on same content
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_report 
ON public.reports (reporter_id, content_type, content_id);

-- Enable realtime for profiles to track live counters (if not already added)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;