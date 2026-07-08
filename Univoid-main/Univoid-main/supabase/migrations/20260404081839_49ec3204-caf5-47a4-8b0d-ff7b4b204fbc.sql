CREATE OR REPLACE FUNCTION public.get_seller_contact(p_book_id uuid)
RETURNS TABLE(mobile text, email text, address text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT seller_mobile, seller_email, seller_address
  FROM public.books
  WHERE id = p_book_id
    AND status = 'approved'
$$;