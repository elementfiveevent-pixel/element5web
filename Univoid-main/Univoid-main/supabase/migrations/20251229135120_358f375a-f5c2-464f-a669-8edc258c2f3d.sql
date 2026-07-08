-- Create a table to store Google Sheets sync configurations per event
CREATE TABLE IF NOT EXISTS public.event_sheets_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  spreadsheet_id TEXT NOT NULL,
  sheet_name TEXT NOT NULL DEFAULT 'Registrations',
  auto_sync BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Enable RLS
ALTER TABLE public.event_sheets_config ENABLE ROW LEVEL SECURITY;

-- Policy: Organizers can manage their own event's config
CREATE POLICY "Organizers can manage their event sheets config"
ON public.event_sheets_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_sheets_config.event_id 
    AND events.organizer_id = auth.uid()
  )
);

-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to trigger auto-sync when new registration is inserted
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
    PERFORM net.http_post(
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on event_registrations
DROP TRIGGER IF EXISTS on_registration_sync_sheets ON public.event_registrations;
CREATE TRIGGER on_registration_sync_sheets
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sheets_auto_sync();

-- Update timestamp trigger
CREATE TRIGGER update_event_sheets_config_updated_at
  BEFORE UPDATE ON public.event_sheets_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();