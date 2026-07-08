-- Migration: Add indexes for performance
-- File: supabase/migrations/20260120000000_add_indexes.sql

-- Index on events for status and start_date ordering
CREATE INDEX IF NOT EXISTS idx_events_status_start_date ON public.events (status, start_date);

-- Index on events for max_capacity queries
CREATE INDEX IF NOT EXISTS idx_events_max_capacity ON public.events (max_capacity);

-- Index on event_registrations for event_id and user_id lookups
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_user ON public.event_registrations (event_id, user_id);

-- Index on event_registrations for payment_status filtering
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status ON public.event_registrations (payment_status);
