-- =====================================================
-- FIX FUNCTION SEARCH PATH MUTABLE WARNINGS
-- Drop trigger first, then recreate function with search_path
-- =====================================================

-- Step 1: Drop the trigger that depends on set_book_slug
DROP TRIGGER IF EXISTS set_book_slug_trigger ON public.books;

-- Step 2: Fix set_book_slug function - add search_path
CREATE OR REPLACE FUNCTION public.set_book_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_book_slug(NEW.title, COALESCE(NEW.id, gen_random_uuid()));
    END IF;
    RETURN NEW;
END;
$$;

-- Step 3: Recreate the trigger
CREATE TRIGGER set_book_slug_trigger
BEFORE INSERT OR UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.set_book_slug();

-- Step 4: Fix normalize_mobile_number function - add search_path
CREATE OR REPLACE FUNCTION public.normalize_mobile_number(mobile text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Remove all non-digit characters and trim
  RETURN regexp_replace(TRIM(COALESCE(mobile, '')), '\D', '', 'g');
END;
$$;