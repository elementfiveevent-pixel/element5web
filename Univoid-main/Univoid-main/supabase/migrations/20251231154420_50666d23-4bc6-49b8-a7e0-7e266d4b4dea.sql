-- Add profile_type and onboarding_status columns to profiles table
-- profile_type: 'quick' for quick registration users, 'full' for normal signup users
-- onboarding_status: 'none' (new), 'partial' (quick reg), 'complete' (full onboarding done)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'full' CHECK (profile_type IN ('quick', 'full')),
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'none' CHECK (onboarding_status IN ('none', 'partial', 'complete'));

-- Update existing profiles that have profile_complete = true to have onboarding_status = 'complete'
UPDATE public.profiles 
SET onboarding_status = 'complete', profile_type = 'full'
WHERE profile_complete = true;

-- Update existing profiles that have profile_complete = false/null to have appropriate status
UPDATE public.profiles 
SET onboarding_status = 'none', profile_type = 'full'
WHERE profile_complete IS NULL OR profile_complete = false;

-- Create index for faster queries on profile_type
CREATE INDEX IF NOT EXISTS idx_profiles_profile_type ON public.profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status ON public.profiles(onboarding_status);