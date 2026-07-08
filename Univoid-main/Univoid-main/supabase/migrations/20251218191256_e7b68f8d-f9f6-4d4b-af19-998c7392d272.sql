-- Add is_disabled column to profiles for user account control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;

-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message (public form)
CREATE POLICY "Anyone can create contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Only admins can view contact messages
CREATE POLICY "Only admins can view contact messages"
ON public.contact_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update contact messages (mark as read)
CREATE POLICY "Only admins can update contact messages"
ON public.contact_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete contact messages
CREATE POLICY "Only admins can delete contact messages"
ON public.contact_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for contact_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;