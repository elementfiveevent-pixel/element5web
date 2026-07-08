-- Create email_logs table for tracking all email communications
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('organizer', 'admin')),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body_preview TEXT,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'partial')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can see all logs
CREATE POLICY "Admins can view all email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Organizers can see their own logs
CREATE POLICY "Organizers can view their own email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

-- Admins can insert logs
CREATE POLICY "Admins can insert email logs"
  ON public.email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR sender_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_email_logs_sender ON public.email_logs(sender_id);
CREATE INDEX idx_email_logs_event ON public.email_logs(event_id);
CREATE INDEX idx_email_logs_created ON public.email_logs(created_at DESC);