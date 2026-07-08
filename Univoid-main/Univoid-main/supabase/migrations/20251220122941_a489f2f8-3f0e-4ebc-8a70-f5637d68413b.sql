-- Add profile_complete column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT false;

-- Add new profile fields for onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS degree text,
ADD COLUMN IF NOT EXISTS branch text,
ADD COLUMN IF NOT EXISTS current_year integer,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS interests text[];

-- Set existing users with college info as profile_complete = true (backward compat)
UPDATE public.profiles 
SET profile_complete = true 
WHERE college_name IS NOT NULL 
  AND college_name != 'Not specified' 
  AND college_name != '';