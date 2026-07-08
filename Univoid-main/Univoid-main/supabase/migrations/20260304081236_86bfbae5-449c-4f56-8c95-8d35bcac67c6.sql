
-- Add detailed payment tracking columns to event_registrations
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS razorpay_payment_method text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_status text,
  ADD COLUMN IF NOT EXISTS razorpay_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS razorpay_payment_details jsonb;
