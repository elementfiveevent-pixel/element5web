-- 1. Create function to count registered users (excluding system user and disabled users)
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
    AND email != 'system@univoid.in'
    AND email NOT LIKE '%system%';
  RETURN user_count;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_registered_users_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_registered_users_count() TO authenticated;

-- 2. Add public SELECT policy to leaderboard_profiles view
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard_profiles;

-- Since leaderboard_profiles is a VIEW, we need to ensure the underlying query works for anon users
-- The view already exists and selects from profiles with is_disabled = false
-- We need to create a simpler function for public leaderboard access

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
    AND p.email != 'system@univoid.in'
  ORDER BY p.total_xp DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard(integer) TO authenticated;

-- 3. Drop ALL event-related tables and data (complete cleanup)
DROP TABLE IF EXISTS public.event_attendance CASCADE;
DROP TABLE IF EXISTS public.event_tickets CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.event_custom_questions CASCADE;
DROP TABLE IF EXISTS public.event_materials CASCADE;
DROP TABLE IF EXISTS public.event_updates CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.organizer_applications CASCADE;

-- Drop event-related enums if they exist and are not used elsewhere
DROP TYPE IF EXISTS public.event_category CASCADE;
DROP TYPE IF EXISTS public.event_type CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.registration_mode CASCADE;
DROP TYPE IF EXISTS public.ticket_status CASCADE;