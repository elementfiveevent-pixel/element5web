-- Add RLS policy to allow admins to update any materials
CREATE POLICY "Admins can update any materials" 
ON public.materials 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy to allow admins to update any news
CREATE POLICY "Admins can update any news" 
ON public.news 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy to allow admins to update any books
CREATE POLICY "Admins can update any books" 
ON public.books 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));