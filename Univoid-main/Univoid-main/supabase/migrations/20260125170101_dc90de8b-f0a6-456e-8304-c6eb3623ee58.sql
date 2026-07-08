-- Create a public bucket for QR code images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-qrcodes', 'ticket-qrcodes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read QR codes (they're public but contain opaque tokens)
CREATE POLICY "Public can view QR codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-qrcodes');

-- Only service role can upload (edge functions use service role)
CREATE POLICY "Service role can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ticket-qrcodes');

-- Service role can delete old QR codes if needed
CREATE POLICY "Service role can delete QR codes"
ON storage.objects FOR DELETE
USING (bucket_id = 'ticket-qrcodes');