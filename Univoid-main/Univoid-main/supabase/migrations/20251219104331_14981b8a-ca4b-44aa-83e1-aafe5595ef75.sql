-- Fix 1: Add admin authorization check to award_xp function
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id UUID,
  _amount INTEGER,
  _reason TEXT,
  _content_type TEXT DEFAULT NULL,
  _content_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require admin role
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can award XP';
  END IF;
  
  INSERT INTO public.xp_transactions (user_id, amount, reason, content_type, content_id)
  VALUES (_user_id, _amount, _reason, _content_type, _content_id);
  
  UPDATE public.profiles
  SET total_xp = total_xp + _amount
  WHERE id = _user_id;
END;
$$;

-- Fix 2: Restrict books table to authenticated users only
DROP POLICY IF EXISTS "All books are viewable by everyone" ON public.books;

CREATE POLICY "Authenticated users can view approved books"
  ON public.books FOR SELECT
  TO authenticated
  USING (status = 'approved' OR auth.uid() = created_by OR has_role(auth.uid(), 'admin'));