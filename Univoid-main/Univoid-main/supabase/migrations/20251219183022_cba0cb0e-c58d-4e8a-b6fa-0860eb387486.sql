-- Enable pgcrypto in extensions schema (where Supabase expects it)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update the function to use uuid instead of gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_ticket_qr()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Use gen_random_uuid which is always available
  RETURN replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
END;
$$;