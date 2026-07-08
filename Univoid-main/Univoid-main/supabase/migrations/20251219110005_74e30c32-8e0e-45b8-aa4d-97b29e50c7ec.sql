-- ============================================
-- STUDY MATERIALS SYSTEM ENHANCEMENTS
-- ============================================

-- Add engagement metrics to materials table
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS downloads_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS file_hash text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS thumbnail_url text DEFAULT NULL;

-- Create material_likes table to track unique likes
CREATE TABLE IF NOT EXISTS public.material_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(material_id, user_id)
);

-- Enable RLS on material_likes
ALTER TABLE public.material_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for material_likes
CREATE POLICY "Users can view their own likes"
  ON public.material_likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can like materials"
  ON public.material_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike materials"
  ON public.material_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to increment material views (public, no auth required)
CREATE OR REPLACE FUNCTION public.increment_material_views(material_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE materials
  SET views_count = views_count + 1
  WHERE id = material_id;
END;
$$;

-- Function to increment material downloads (requires auth)
CREATE OR REPLACE FUNCTION public.increment_material_downloads(material_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  UPDATE materials
  SET downloads_count = downloads_count + 1
  WHERE id = material_id;
END;
$$;

-- Function to toggle material like (returns new like status)
CREATE OR REPLACE FUNCTION public.toggle_material_like(p_material_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM material_likes 
    WHERE material_id = p_material_id AND user_id = v_user_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remove like
    DELETE FROM material_likes 
    WHERE material_id = p_material_id AND user_id = v_user_id;
    
    UPDATE materials SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = p_material_id;
    
    RETURN false;
  ELSE
    -- Add like
    INSERT INTO material_likes (material_id, user_id) 
    VALUES (p_material_id, v_user_id);
    
    UPDATE materials SET likes_count = likes_count + 1
    WHERE id = p_material_id;
    
    RETURN true;
  END IF;
END;
$$;

-- Function to increment shares
CREATE OR REPLACE FUNCTION public.increment_material_shares(material_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE materials
  SET shares_count = shares_count + 1
  WHERE id = material_id;
END;
$$;

-- ============================================
-- BOOK EXCHANGE ENHANCEMENTS
-- ============================================

-- Add category and author to books table
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS category text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS author text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0 NOT NULL;

-- Function to get recommended books based on category
CREATE OR REPLACE FUNCTION public.get_book_recommendations(p_book_id uuid, p_limit integer DEFAULT 6)
RETURNS SETOF books
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category text;
BEGIN
  -- Get the category of the current book
  SELECT category INTO v_category FROM books WHERE id = p_book_id;
  
  -- Return books in same category, ordered by views and recency
  RETURN QUERY
  SELECT b.*
  FROM books b
  WHERE b.id != p_book_id
    AND b.status = 'approved'
    AND b.is_sold = false
    AND (v_category IS NULL OR b.category = v_category OR b.category IS NULL)
  ORDER BY 
    CASE WHEN b.category = v_category THEN 0 ELSE 1 END,
    b.views_count DESC,
    b.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to increment book views
CREATE OR REPLACE FUNCTION public.increment_book_views(book_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE books
  SET views_count = views_count + 1
  WHERE id = book_id;
END;
$$;

-- ============================================
-- AUTHENTICATION HARDENING
-- ============================================

-- Table to store blocked disposable email domains
CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blocked domains
CREATE POLICY "Admins can manage blocked domains"
  ON public.blocked_email_domains FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read blocked domains"
  ON public.blocked_email_domains FOR SELECT
  USING (true);

-- Insert common disposable email domains
INSERT INTO public.blocked_email_domains (domain) VALUES
  ('tempmail.com'),
  ('guerrillamail.com'),
  ('10minutemail.com'),
  ('mailinator.com'),
  ('throwaway.email'),
  ('temp-mail.org'),
  ('fakeinbox.com'),
  ('trashmail.com'),
  ('getnada.com'),
  ('yopmail.com'),
  ('sharklasers.com'),
  ('guerrillamail.info'),
  ('grr.la'),
  ('guerrillamail.biz'),
  ('guerrillamail.de'),
  ('pokemail.net'),
  ('spam4.me'),
  ('binkmail.com'),
  ('safetymail.info'),
  ('spamfree24.org'),
  ('trashmail.net'),
  ('mailnesia.com'),
  ('anonbox.net'),
  ('mohmal.com'),
  ('tempail.com'),
  ('maildrop.cc'),
  ('dispostable.com'),
  ('mailsac.com'),
  ('tempr.email'),
  ('mintemail.com')
ON CONFLICT (domain) DO NOTHING;

-- Function to check if email domain is blocked
CREATE OR REPLACE FUNCTION public.is_email_blocked(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain text;
BEGIN
  -- Extract domain from email
  v_domain := lower(split_part(p_email, '@', 2));
  
  RETURN EXISTS(
    SELECT 1 FROM blocked_email_domains WHERE domain = v_domain
  );
END;
$$;

-- Check if user has liked a specific material
CREATE OR REPLACE FUNCTION public.user_has_liked_material(p_material_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS(
    SELECT 1 FROM material_likes 
    WHERE material_id = p_material_id AND user_id = auth.uid()
  );
END;
$$;