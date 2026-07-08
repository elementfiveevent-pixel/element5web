-- Add allow_custom_input and related columns to event_upsells for editable custom add-ons
ALTER TABLE public.event_upsells 
ADD COLUMN IF NOT EXISTS allow_custom_input boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_input_label text,
ADD COLUMN IF NOT EXISTS custom_input_placeholder text,
ADD COLUMN IF NOT EXISTS custom_input_max_length integer DEFAULT 200;

-- Add custom_input_value to registration_addons to store user's text input
ALTER TABLE public.registration_addons 
ADD COLUMN IF NOT EXISTS custom_input_value text;

-- Add group_size to event_tickets for group booking tracking
ALTER TABLE public.event_tickets 
ADD COLUMN IF NOT EXISTS group_size integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_group_booking boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS group_entry_acknowledged boolean DEFAULT false;

-- Add group-related columns to event_registrations if not exists
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS is_group_booking boolean DEFAULT false;