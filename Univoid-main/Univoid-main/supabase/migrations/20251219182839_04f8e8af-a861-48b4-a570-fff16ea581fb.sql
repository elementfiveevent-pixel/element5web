-- Enable the pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate the generate_ticket_qr function with the extension
CREATE OR REPLACE FUNCTION public.generate_ticket_qr()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  qr_code TEXT;
BEGIN
  qr_code := encode(gen_random_bytes(32), 'hex');
  RETURN qr_code;
END;
$$;