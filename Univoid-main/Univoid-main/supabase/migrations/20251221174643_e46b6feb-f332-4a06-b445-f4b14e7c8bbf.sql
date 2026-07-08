-- Update get_books_safe to allow ALL users (including anonymous) to see approved books
CREATE OR REPLACE FUNCTION public.get_books_safe(
  p_status content_status DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
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
      WHEN v_user_id IS NOT NULL AND (v_user_id = b.created_by OR has_role(v_user_id, 'admin')) 
      THEN b.seller_email 
      ELSE '••••••••@••••.com'::text 
    END as seller_email,
    CASE 
      WHEN v_user_id IS NOT NULL AND (v_user_id = b.created_by OR has_role(v_user_id, 'admin')) 
      THEN b.seller_mobile 
      ELSE '••••••••••'::text 
    END as seller_mobile,
    CASE 
      WHEN v_user_id IS NOT NULL AND (v_user_id = b.created_by OR has_role(v_user_id, 'admin')) 
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
    AND (
      b.status = 'approved' 
      OR (v_user_id IS NOT NULL AND v_user_id = b.created_by)
      OR (v_user_id IS NOT NULL AND has_role(v_user_id, 'admin'))
    )
    AND b.is_sold = false
  ORDER BY b.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Update get_book_by_id_safe similarly
CREATE OR REPLACE FUNCTION public.get_book_by_id_safe(p_book_id uuid)
RETURNS TABLE(
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
      WHEN v_user_id IS NOT NULL AND (v_user_id = b.created_by OR has_role(v_user_id, 'admin')) 
      THEN b.seller_email 
      ELSE '••••••••@••••.com'::text 
    END as seller_email,
    CASE 
      WHEN v_user_id IS NOT NULL AND (v_user_id = b.created_by OR has_role(v_user_id, 'admin')) 
      THEN b.seller_mobile 
      ELSE '••••••••••'::text 
    END as seller_mobile,
    CASE 
      WHEN v_user_id IS NOT NULL AND (v_user_id = b.created_by OR has_role(v_user_id, 'admin')) 
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
    AND (
      b.status = 'approved' 
      OR (v_user_id IS NOT NULL AND v_user_id = b.created_by)
      OR (v_user_id IS NOT NULL AND has_role(v_user_id, 'admin'))
    );
END;
$$;

-- Update is_admin_or_assistant function to include admin_assistant role
CREATE OR REPLACE FUNCTION public.is_admin_or_assistant(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'admin_assistant')
  )
$$;