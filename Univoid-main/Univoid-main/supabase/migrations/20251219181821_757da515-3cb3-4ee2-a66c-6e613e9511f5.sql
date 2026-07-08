-- Fix Security Definer View issue: Recreate view with SECURITY INVOKER (default, but explicit)
DROP VIEW IF EXISTS leaderboard_profiles;

CREATE VIEW leaderboard_profiles AS
SELECT 
    id,
    full_name,
    profile_photo_url,
    college_name,
    total_xp
FROM profiles
WHERE is_disabled = false
  AND email NOT LIKE '%system%univoid%'
ORDER BY total_xp DESC;

-- Ensure it uses invoker security (this is default but making it explicit)
ALTER VIEW leaderboard_profiles SET (security_invoker = on);

-- Grant access
GRANT SELECT ON leaderboard_profiles TO anon, authenticated;