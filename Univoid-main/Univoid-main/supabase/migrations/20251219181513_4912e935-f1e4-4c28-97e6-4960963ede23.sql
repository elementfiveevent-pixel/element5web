-- Drop and recreate the view without security_barrier (which caused the security definer issue)
DROP VIEW IF EXISTS leaderboard_profiles;

-- Simple view that only exposes safe public data
CREATE VIEW leaderboard_profiles AS
SELECT 
    id,
    full_name,
    profile_photo_url,
    college_name,
    total_xp
FROM profiles
WHERE is_disabled = false
  AND email NOT LIKE '%system%univoid%';

-- Grant access
GRANT SELECT ON leaderboard_profiles TO anon, authenticated;