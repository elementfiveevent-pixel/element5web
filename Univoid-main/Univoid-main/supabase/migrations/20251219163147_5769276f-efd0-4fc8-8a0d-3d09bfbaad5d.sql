-- Drop the current permissive SELECT policy that exposes all data
DROP POLICY IF EXISTS "Authenticated users can view books" ON public.books;

-- Create restrictive policy: only owners and admins can directly SELECT from books table
-- All other access must go through the safe RPC functions which mask contact info
CREATE POLICY "Only owners and admins can view books directly"
ON public.books
FOR SELECT
USING (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add a comment explaining the security model
COMMENT ON TABLE public.books IS 'Book listings table. Direct SELECT restricted to owners/admins. Use get_books_safe() and get_book_by_id_safe() RPC functions for public access with masked contact info.';