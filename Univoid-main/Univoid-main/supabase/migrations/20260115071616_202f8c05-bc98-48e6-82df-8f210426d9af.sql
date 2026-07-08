-- Add slug column to books table for SEO-friendly URLs
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create a function to generate slugs from titles
CREATE OR REPLACE FUNCTION public.generate_book_slug(book_title TEXT, book_id UUID)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing books with slugs
UPDATE public.books 
SET slug = generate_book_slug(title, id)
WHERE slug IS NULL;

-- Create trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.set_book_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_book_slug(NEW.title, COALESCE(NEW.id, gen_random_uuid()));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_book_slug_trigger ON public.books;
CREATE TRIGGER set_book_slug_trigger
    BEFORE INSERT ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION public.set_book_slug();

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_books_slug ON public.books(slug);

-- Add unique constraint (with coalesce for backwards compatibility)
ALTER TABLE public.books ADD CONSTRAINT books_slug_unique UNIQUE (slug);