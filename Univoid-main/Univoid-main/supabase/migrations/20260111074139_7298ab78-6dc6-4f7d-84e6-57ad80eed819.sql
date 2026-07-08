-- Add enable_quick_register column to events table
ALTER TABLE public.events 
ADD COLUMN enable_quick_register BOOLEAN NOT NULL DEFAULT TRUE;