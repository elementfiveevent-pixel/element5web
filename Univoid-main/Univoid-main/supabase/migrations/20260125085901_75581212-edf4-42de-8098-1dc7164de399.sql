-- Fix the organizer-logos storage policies to use folder structure
DROP POLICY IF EXISTS "Users can upload their own organizer logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own organizer logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own organizer logo" ON storage.objects;

-- Create new policies using folder structure (userId/filename)
CREATE POLICY "Users can upload their own organizer logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organizer-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own organizer logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organizer-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own organizer logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organizer-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);