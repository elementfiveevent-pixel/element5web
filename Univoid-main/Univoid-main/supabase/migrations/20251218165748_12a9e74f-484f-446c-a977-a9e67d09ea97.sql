
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('book-images', 'book-images', true);

-- Storage policies for profile-photos
CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for materials (private - download requires auth)
CREATE POLICY "Authenticated users can view materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'materials');

CREATE POLICY "Users can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materials' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for blog-images
CREATE POLICY "Blog images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Users can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for news-images
CREATE POLICY "News images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

CREATE POLICY "Users can upload news images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'news-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own news images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'news-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for book-images
CREATE POLICY "Book images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-images');

CREATE POLICY "Users can upload book images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own book images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'book-images' AND auth.uid()::text = (storage.foldername(name))[1]);
