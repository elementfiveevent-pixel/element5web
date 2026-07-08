-- Drop the current policy that allows unauthenticated access
DROP POLICY IF EXISTS "Authenticated users can view approved books" ON public.books;

-- Create new policy requiring authentication for all book views
CREATE POLICY "Authenticated users can view books"
ON public.books
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    status = 'approved'::content_status 
    OR auth.uid() = created_by 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);