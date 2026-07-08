-- Drop the blogs table
DROP TABLE IF EXISTS public.blogs CASCADE;

-- Drop the blog-images storage bucket
DELETE FROM storage.objects WHERE bucket_id = 'blog-images';
DELETE FROM storage.buckets WHERE id = 'blog-images';