-- Fix function search paths for security
ALTER FUNCTION public.generate_event_slug(text, uuid) SET search_path = public;
ALTER FUNCTION public.set_event_slug() SET search_path = public;
ALTER FUNCTION public.get_event_by_id_or_slug(text) SET search_path = public;