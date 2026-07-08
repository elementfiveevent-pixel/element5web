-- Drop the existing view and recreate with security barrier
DROP VIEW IF EXISTS leaderboard_profiles;

-- Recreate view with security_barrier to prevent data leakage
CREATE VIEW leaderboard_profiles WITH (security_barrier = true) AS
SELECT 
    id,
    full_name,
    profile_photo_url,
    college_name,
    total_xp
FROM profiles
WHERE is_disabled = false
  AND email NOT LIKE '%system%univoid%';

-- Grant access to authenticated and anon users for the leaderboard
GRANT SELECT ON leaderboard_profiles TO anon, authenticated;