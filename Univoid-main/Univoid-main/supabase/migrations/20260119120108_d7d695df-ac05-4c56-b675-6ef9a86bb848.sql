-- Fix generate_book_slug function - add search_path
-- This function is used by set_book_slug trigger
CREATE OR REPLACE FUNCTION public.generate_book_slug(book_title text, book_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate base slug from title
    base_slug := LOWER(TRIM(book_title));
    base_slug := REGEXP_REPLACE(base_slug, '[^\w\s-]', '', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Limit slug length
    IF LENGTH(base_slug) > 80 THEN
        base_slug := LEFT(base_slug, 80);
        base_slug := TRIM(BOTH '-' FROM base_slug);
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM public.books WHERE slug = final_slug AND id != book_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$;