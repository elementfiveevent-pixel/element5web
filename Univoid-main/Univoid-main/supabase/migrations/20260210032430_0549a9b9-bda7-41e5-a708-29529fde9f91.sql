
-- Fix trigger_sheets_auto_sync to handle missing http extension gracefully
CREATE OR REPLACE FUNCTION public.trigger_sheets_auto_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  config_record RECORD;
BEGIN
  -- Get the sheets config for this event
  SELECT * INTO config_record 
  FROM public.event_sheets_config 
  WHERE event_id = NEW.event_id AND auto_sync = true;
  
  -- If auto-sync is enabled for this event
  IF FOUND THEN
    BEGIN
      -- Try using net.http_post (pg_net extension)
      PERFORM net.http_post(
        url := 'https://rtvrdbbojqsrbkngnjgq.supabase.co/functions/v1/sync-to-sheets',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dnJkYmJvanFzcmJrbmduamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjk4OTgsImV4cCI6MjA4MTY0NTg5OH0.z_JT_lu32_0MEr7rV2vgr19gO-R7NzMYt-qTQc2SBhc'
        ),
        body := jsonb_build_object(
          'eventId', NEW.event_id::text,
          'spreadsheetId', config_record.spreadsheet_id,
          'sheetName', config_record.sheet_name
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Don't fail the registration if sheets sync fails
      RAISE WARNING 'Sheets auto-sync failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;
