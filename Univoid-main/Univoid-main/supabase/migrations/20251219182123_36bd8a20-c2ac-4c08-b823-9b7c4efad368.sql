-- Drop the restrictive organizer-only policy for event-assets uploads
DROP POLICY IF EXISTS "Organizers can upload event assets" ON storage.objects;

-- Create new policy allowing any authenticated user to upload event assets
CREATE POLICY "Authenticated users can upload event assets" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'event-assets' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);