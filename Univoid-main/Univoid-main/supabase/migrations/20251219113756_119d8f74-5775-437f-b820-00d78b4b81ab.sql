-- Fix the system user email filter in both functions
CREATE OR REPLACE FUNCTION public.get_registered_users_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO user_count
  FROM profiles
  WHERE is_disabled = false
    AND email NOT LIKE '%system%univoid%';
  RETURN user_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_leaderboard(limit_count integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  full_name text,
  profile_photo_url text,
  total_xp integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.profile_photo_url,
    p.total_xp
  FROM profiles p
  WHERE p.is_disabled = false
    AND p.email NOT LIKE '%system%univoid%'
  ORDER BY p.total_xp DESC
  LIMIT limit_count;
END;
$$;