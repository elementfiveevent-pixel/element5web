-- Create enum for form field types
CREATE TYPE public.form_field_type AS ENUM (
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'date',
  'time',
  'datetime',
  'select',
  'radio',
  'checkbox',
  'file'
);

-- Create table for custom form fields per event
CREATE TABLE public.event_form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  field_type public.form_field_type NOT NULL DEFAULT 'text',
  label TEXT NOT NULL,
  description TEXT,
  placeholder TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  field_order INTEGER NOT NULL DEFAULT 0,
  options JSONB, -- For select, radio, checkbox options: [{label: string, value: string}]
  validation_rules JSONB, -- {minLength, maxLength, pattern, min, max, etc.}
  conditional_logic JSONB, -- {showWhen: {fieldId: string, value: string}}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for form templates
CREATE TABLE public.event_form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of field configurations
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_form_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_form_fields
-- Anyone can view form fields for published events
CREATE POLICY "Anyone can view form fields for published events"
ON public.event_form_fields
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_form_fields.event_id 
    AND events.status = 'published'
  )
);

-- Organizers can manage their event form fields
CREATE POLICY "Organizers can manage their event form fields"
ON public.event_form_fields
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_form_fields.event_id 
    AND events.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_form_fields.event_id 
    AND events.organizer_id = auth.uid()
  )
);

-- Admins can manage all form fields
CREATE POLICY "Admins can manage all form fields"
ON public.event_form_fields
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for form templates
CREATE POLICY "Users can view their own templates"
ON public.event_form_templates
FOR SELECT
USING (organizer_id = auth.uid());

CREATE POLICY "Users can create their own templates"
ON public.event_form_templates
FOR INSERT
WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Users can update their own templates"
ON public.event_form_templates
FOR UPDATE
USING (organizer_id = auth.uid());

CREATE POLICY "Users can delete their own templates"
ON public.event_form_templates
FOR DELETE
USING (organizer_id = auth.uid());

-- Admins can manage all templates
CREATE POLICY "Admins can manage all templates"
ON public.event_form_templates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_event_form_fields_event_id ON public.event_form_fields(event_id);
CREATE INDEX idx_event_form_fields_order ON public.event_form_fields(event_id, field_order);
CREATE INDEX idx_event_form_templates_organizer ON public.event_form_templates(organizer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_event_form_fields_updated_at
BEFORE UPDATE ON public.event_form_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_form_templates_updated_at
BEFORE UPDATE ON public.event_form_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();