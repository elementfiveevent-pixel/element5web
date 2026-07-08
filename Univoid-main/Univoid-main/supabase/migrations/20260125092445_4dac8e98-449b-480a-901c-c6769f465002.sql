-- Create a function to call the Google indexing edge function when an event is published
CREATE OR REPLACE FUNCTION public.trigger_google_indexing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Only trigger on publish (status changes to 'published')
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Use pg_net to call the edge function asynchronously if available
    -- This is a best-effort call - failures won't block the transaction
    BEGIN
      PERFORM net.http_post(
        url := current_setting('app.settings.edge_function_url', true) || '/submit-to-google-indexing',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'event_id', NEW.id,
          'event_slug', NEW.slug,
          'event_title', NEW.title
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to trigger Google indexing: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: The automatic trigger requires pg_net extension which may not be enabled
-- The indexing function can be called manually or via a scheduled cron job instead

-- Add a comment explaining how to enable automatic indexing
COMMENT ON FUNCTION public.trigger_google_indexing() IS 
'Attempts to trigger Google indexing when an event is published. 
Requires pg_net extension for HTTP calls. 
Alternative: Use Supabase cron to call submit-to-google-indexing edge function daily.';