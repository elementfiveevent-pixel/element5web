-- Create storage bucket for organizer logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organizer-logos', 'organizer-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for organizer logos
CREATE POLICY "Organizer logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'organizer-logos');

CREATE POLICY "Users can upload their own organizer logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organizer-logos' 
  AND auth.uid()::text = (string_to_array(name, '-'))[1]
);

CREATE POLICY "Users can update their own organizer logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organizer-logos' 
  AND auth.uid()::text = (string_to_array(name, '-'))[1]
);

CREATE POLICY "Users can delete their own organizer logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organizer-logos' 
  AND auth.uid()::text = (string_to_array(name, '-'))[1]
);