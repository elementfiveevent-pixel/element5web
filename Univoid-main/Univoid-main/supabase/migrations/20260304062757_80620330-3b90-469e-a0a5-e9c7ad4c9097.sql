
-- Add Razorpay payment columns to event_registrations
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS razorpay_order_id text,
ADD COLUMN IF NOT EXISTS razorpay_payment_id text;

-- Index for quick order lookups
CREATE INDEX IF NOT EXISTS idx_registrations_razorpay_order ON public.event_registrations(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
