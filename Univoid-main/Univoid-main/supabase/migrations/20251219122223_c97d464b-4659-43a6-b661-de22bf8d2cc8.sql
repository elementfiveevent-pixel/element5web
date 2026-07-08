-- Create a function to get books with masked contact info for non-owners
CREATE OR REPLACE FUNCTION public.get_books_safe(
  p_status content_status DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  description text,
  price numeric,
  condition text,
  category text,
  image_urls text[],
  seller_email text,
  seller_mobile text,
  seller_address text,
  is_sold boolean,
  views_count integer,
  status content_status,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.author,
    b.description,
    b.price,
    b.condition,
    b.category,
    b.image_urls,
    -- Only show contact info to owner or admin
    CASE 
      WHEN v_user_id = b.created_by OR has_role(v_user_id, 'admin') 
      THEN b.seller_email 
      ELSE '••••••••@••••.com'::text 
    END as seller_email,
    CASE 
      WHEN v_user_id = b.created_by OR has_role(v_user_id, 'admin') 
      THEN b.seller_mobile 
      ELSE '••••••••••'::text 
    END as seller_mobile,
    CASE 
      WHEN v_user_id = b.created_by OR has_role(v_user_id, 'admin') 
      THEN b.seller_address 
      ELSE 'Contact seller for address'::text 
    END as seller_address,
    b.is_sold,
    b.views_count,
    b.status,
    b.created_by,
    b.created_at,
    b.updated_at
  FROM books b
  WHERE (p_status IS NULL OR b.status = p_status)
    AND (b.status = 'approved' OR v_user_id = b.created_by OR has_role(v_user_id, 'admin'))
  ORDER BY b.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create a function to get a single book with masked contact info
CREATE OR REPLACE FUNCTION public.get_book_by_id_safe(p_book_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  description text,
  price numeric,
  condition text,
  category text,
  image_urls text[],
  seller_email text,
  seller_mobile text,
  seller_address text,
  is_sold boolean,
  views_count integer,
  status content_status,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.author,
    b.description,
    b.price,
    b.condition,
    b.category,
    b.image_urls,
    CASE 
      WHEN v_user_id = b.created_by OR has_role(v_user_id, 'admin') 
      THEN b.seller_email 
      ELSE '••••••••@••••.com'::text 
    END as seller_email,
    CASE 
      WHEN v_user_id = b.created_by OR has_role(v_user_id, 'admin') 
      THEN b.seller_mobile 
      ELSE '••••••••••'::text 
    END as seller_mobile,
    CASE 
      WHEN v_user_id = b.created_by OR has_role(v_user_id, 'admin') 
      THEN b.seller_address 
      ELSE 'Contact seller for address'::text 
    END as seller_address,
    b.is_sold,
    b.views_count,
    b.status,
    b.created_by,
    b.created_at,
    b.updated_at
  FROM books b
  WHERE b.id = p_book_id
    AND (b.status = 'approved' OR v_user_id = b.created_by OR has_role(v_user_id, 'admin'));
END;
$$;