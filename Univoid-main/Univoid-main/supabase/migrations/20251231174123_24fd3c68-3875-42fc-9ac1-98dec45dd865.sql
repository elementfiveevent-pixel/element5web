-- First, clean up duplicate mobile numbers by keeping only the most recent one
-- For duplicate mobile numbers, set older records to NULL
WITH duplicates AS (
  SELECT id, mobile_number,
    ROW_NUMBER() OVER (PARTITION BY mobile_number ORDER BY created_at DESC) as rn
  FROM profiles
  WHERE mobile_number IS NOT NULL AND TRIM(mobile_number) != ''
)
UPDATE profiles 
SET mobile_number = NULL
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Create a function to normalize mobile numbers
CREATE OR REPLACE FUNCTION public.normalize_mobile_number(mobile text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Remove all non-digit characters and trim
  RETURN regexp_replace(TRIM(COALESCE(mobile, '')), '\D', '', 'g');
END;
$$;

-- Create unique index on normalized mobile number (only for non-empty values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_mobile_unique 
ON public.profiles (normalize_mobile_number(mobile_number))
WHERE mobile_number IS NOT NULL AND TRIM(mobile_number) != '';

-- Add a function to check if mobile number already exists
CREATE OR REPLACE FUNCTION public.check_mobile_exists(p_mobile text, p_exclude_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  normalized_mobile text;
BEGIN
  normalized_mobile := normalize_mobile_number(p_mobile);
  
  IF normalized_mobile = '' OR length(normalized_mobile) != 10 THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE normalize_mobile_number(mobile_number) = normalized_mobile
    AND (p_exclude_user_id IS NULL OR id != p_exclude_user_id)
  );
END;
$$;