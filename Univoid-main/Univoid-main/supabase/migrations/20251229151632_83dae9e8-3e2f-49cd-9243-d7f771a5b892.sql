-- Create a secure function to find user by email from auth.users
-- This function allows looking up users by email with proper security
CREATE OR REPLACE FUNCTION public.find_user_by_email(search_email TEXT)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email TEXT;
BEGIN
  -- Normalize the email
  normalized_email := LOWER(TRIM(search_email));
  
  -- First try to find in profiles table (has user details)
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email as user_email,
    p.full_name as user_full_name
  FROM profiles p
  WHERE LOWER(p.email) = normalized_email
  LIMIT 1;
  
  -- If found in profiles, we're done
  IF FOUND THEN
    RETURN;
  END IF;
  
  -- Fallback: Check auth.users for OAuth users who might not be in profiles
  -- and auto-create a profile entry for them
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email as user_email,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      SPLIT_PART(au.email, '@', 1)
    ) as user_full_name
  FROM auth.users au
  WHERE LOWER(au.email) = normalized_email
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO authenticated;