-- Allow admins to delete any materials
CREATE POLICY "Admins can delete any materials"
ON public.materials
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete any blogs
CREATE POLICY "Admins can delete any blogs"
ON public.blogs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete any news
CREATE POLICY "Admins can delete any news"
ON public.news
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete any books
CREATE POLICY "Admins can delete any books"
ON public.books
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete any profile
CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete any user roles
CREATE POLICY "Admins can delete any user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete any xp_transactions
CREATE POLICY "Admins can delete any xp_transactions"
ON public.xp_transactions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));