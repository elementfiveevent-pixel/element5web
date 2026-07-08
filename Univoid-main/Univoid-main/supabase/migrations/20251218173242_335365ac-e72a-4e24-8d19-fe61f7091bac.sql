-- Remove admin-based restrictions and allow instant publishing
-- All content will be public immediately after creation

-- Update materials RLS policies
DROP POLICY IF EXISTS "Approved materials are viewable by everyone" ON public.materials;
DROP POLICY IF EXISTS "Admins can delete materials" ON public.materials;

CREATE POLICY "All materials are viewable by everyone" 
ON public.materials 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete own materials" 
ON public.materials 
FOR DELETE 
USING (auth.uid() = created_by);

-- Update blogs RLS policies
DROP POLICY IF EXISTS "Approved blogs are viewable by everyone" ON public.blogs;
DROP POLICY IF EXISTS "Admins can delete blogs" ON public.blogs;

CREATE POLICY "All blogs are viewable by everyone" 
ON public.blogs 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete own blogs" 
ON public.blogs 
FOR DELETE 
USING (auth.uid() = created_by);

-- Update news RLS policies
DROP POLICY IF EXISTS "Approved news are viewable by everyone" ON public.news;
DROP POLICY IF EXISTS "Admins can delete news" ON public.news;

CREATE POLICY "All news are viewable by everyone" 
ON public.news 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete own news" 
ON public.news 
FOR DELETE 
USING (auth.uid() = created_by);

-- Update books RLS policies
DROP POLICY IF EXISTS "Approved books are viewable by everyone" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;

CREATE POLICY "All books are viewable by everyone" 
ON public.books 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete own books" 
ON public.books 
FOR DELETE 
USING (auth.uid() = created_by);

-- Update update policies to remove admin checks
DROP POLICY IF EXISTS "Users can update own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can update own blogs" ON public.blogs;
DROP POLICY IF EXISTS "Users can update own news" ON public.news;
DROP POLICY IF EXISTS "Users can update own books" ON public.books;

CREATE POLICY "Users can update own materials" 
ON public.materials 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can update own blogs" 
ON public.blogs 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can update own news" 
ON public.news 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can update own books" 
ON public.books 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Enable realtime for all content tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blogs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;