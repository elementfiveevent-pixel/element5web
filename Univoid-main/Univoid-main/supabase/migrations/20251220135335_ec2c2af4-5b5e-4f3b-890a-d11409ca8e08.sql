-- Create function to call edge function when event is published
CREATE OR REPLACE FUNCTION public.notify_on_event_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only trigger when status changes to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Get the edge function URL from environment
    edge_function_url := 'https://rtvrdbbojqsrbkngnjgq.supabase.co/functions/v1/notify-matching-events';
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- Use pg_net to call the edge function asynchronously
    PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_role_key, current_setting('request.headers', true)::json->>'authorization')
      ),
      body := jsonb_build_object('event_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to notify matching events: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create trigger for event publish notifications
DROP TRIGGER IF EXISTS on_event_publish_notify ON public.events;
CREATE TRIGGER on_event_publish_notify
  AFTER INSERT OR UPDATE OF status ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_event_publish();