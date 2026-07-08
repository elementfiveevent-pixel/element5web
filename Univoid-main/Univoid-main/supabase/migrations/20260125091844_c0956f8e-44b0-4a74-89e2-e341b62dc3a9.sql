-- Add slug column to events table for SEO-friendly URLs
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_event_slug(title text, event_id uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from title
  base_slug := lower(regexp_replace(
    regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
  
  -- Trim to max 50 chars
  base_slug := substring(base_slug from 1 for 50);
  
  -- Remove trailing hyphens
  base_slug := regexp_replace(base_slug, '-+$', '');
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug AND id != event_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.set_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if not provided or if title changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.title != NEW.title AND NEW.slug = OLD.slug) THEN
    NEW.slug := public.generate_event_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_event_slug ON public.events;
CREATE TRIGGER trigger_set_event_slug
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.set_event_slug();

-- Backfill existing events with slugs
UPDATE public.events 
SET slug = public.generate_event_slug(title, id)
WHERE slug IS NULL;

-- Create RPC function to fetch event by ID or slug
CREATE OR REPLACE FUNCTION public.get_event_by_id_or_slug(p_identifier text)
RETURNS SETOF public.events AS $$
BEGIN
  -- First try to match as UUID
  IF p_identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY SELECT * FROM public.events WHERE id = p_identifier::uuid AND status = 'published';
  ELSE
    -- Match as slug
    RETURN QUERY SELECT * FROM public.events WHERE slug = p_identifier AND status = 'published';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;