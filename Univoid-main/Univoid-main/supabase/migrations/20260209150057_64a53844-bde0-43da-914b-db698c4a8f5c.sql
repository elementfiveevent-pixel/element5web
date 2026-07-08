
-- Add qr_code column to ticket_attendees for guest QR tracking
ALTER TABLE public.ticket_attendees 
ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Add index for guest QR lookups during check-in
CREATE INDEX IF NOT EXISTS idx_ticket_attendees_qr_code ON public.ticket_attendees(qr_code) WHERE qr_code IS NOT NULL;
