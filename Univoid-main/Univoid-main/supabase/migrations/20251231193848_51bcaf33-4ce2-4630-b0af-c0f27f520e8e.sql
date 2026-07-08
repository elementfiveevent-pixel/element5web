-- Event upsells and add-ons configuration table
CREATE TABLE public.event_upsells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  upsell_type TEXT NOT NULL CHECK (upsell_type IN ('group_offer', 'addon', 'custom_addon')),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER DEFAULT 10,
  group_size INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event upsell settings per event
CREATE TABLE public.event_upsell_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  upsell_enabled BOOLEAN NOT NULL DEFAULT false,
  show_group_offers BOOLEAN NOT NULL DEFAULT true,
  show_addons BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registration add-ons junction table
CREATE TABLE public.registration_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  upsell_id UUID NOT NULL REFERENCES public.event_upsells(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_upsells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_upsell_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_upsells
CREATE POLICY "Anyone can view active upsells for published events"
ON public.event_upsells FOR SELECT
USING (
  is_active = true AND
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND status = 'published')
);

CREATE POLICY "Organizers can manage their event upsells"
ON public.event_upsells FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
);

-- RLS Policies for event_upsell_settings
CREATE POLICY "Anyone can view upsell settings for published events"
ON public.event_upsell_settings FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND status = 'published')
);

CREATE POLICY "Organizers can manage their upsell settings"
ON public.event_upsell_settings FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
);

-- RLS Policies for registration_addons
CREATE POLICY "Users can view their own addons"
ON public.registration_addons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_registrations 
    WHERE id = registration_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own addons"
ON public.registration_addons FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_registrations 
    WHERE id = registration_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can view addons for their events"
ON public.registration_addons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_registrations er
    JOIN public.events e ON er.event_id = e.id
    WHERE er.id = registration_id AND e.organizer_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_event_upsells_event_id ON public.event_upsells(event_id);
CREATE INDEX idx_event_upsell_settings_event_id ON public.event_upsell_settings(event_id);
CREATE INDEX idx_registration_addons_registration_id ON public.registration_addons(registration_id);

-- Add columns for tracking totals
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS base_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS addons_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS group_size INTEGER DEFAULT 1;

-- Triggers for updated_at
CREATE TRIGGER update_event_upsells_updated_at
BEFORE UPDATE ON public.event_upsells
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_upsell_settings_updated_at
BEFORE UPDATE ON public.event_upsell_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();