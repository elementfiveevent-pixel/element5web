-- Add granular notification preferences for interests and location
ALTER TABLE public.email_preferences
ADD COLUMN IF NOT EXISTS interest_based_alerts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS location_based_alerts boolean DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.email_preferences.interest_based_alerts IS 'Receive alerts for events matching user interests';
COMMENT ON COLUMN public.email_preferences.location_based_alerts IS 'Receive alerts for events in user city/location';