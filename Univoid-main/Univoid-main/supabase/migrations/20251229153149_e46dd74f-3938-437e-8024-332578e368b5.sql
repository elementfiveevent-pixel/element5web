-- Enable http extension for making HTTP requests from PostgreSQL
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Also ensure pg_net is available (Supabase's async HTTP)
-- Note: pg_net should already be available on Supabase, but let's make sure
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;