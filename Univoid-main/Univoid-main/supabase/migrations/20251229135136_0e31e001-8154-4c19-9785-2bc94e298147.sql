-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.trigger_sheets_auto_sync()
RETURNS TRIGGER AS $$
DECLARE
  config_record RECORD;
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Get the sheets config for this event
  SELECT * INTO config_record 
  FROM public.event_sheets_config 
  WHERE event_id = NEW.event_id AND auto_sync = true;
  
  -- If auto-sync is enabled for this event
  IF FOUND THEN
    -- Get Supabase URL from environment (set via vault or config)
    supabase_url := current_setting('app.settings.supabase_url', true);
    service_key := current_setting('app.settings.service_role_key', true);
    
    -- Queue HTTP request to sync edge function (fire and forget)
    PERFORM extensions.http_post(
      url := supabase_url || '/functions/v1/sync-to-sheets',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'eventId', NEW.event_id::text,
        'spreadsheetId', config_record.spreadsheet_id,
        'sheetName', config_record.sheet_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;