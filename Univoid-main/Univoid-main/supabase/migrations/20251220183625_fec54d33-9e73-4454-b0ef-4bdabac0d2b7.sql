-- Create error_logs table for tracking admin and app errors
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  page_route TEXT,
  component_name TEXT,
  metadata JSONB,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all error logs
CREATE POLICY "Admins can view all error logs"
ON public.error_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Any authenticated user can insert error logs (to report their own errors)
CREATE POLICY "Authenticated users can insert error logs"
ON public.error_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_page_route ON public.error_logs(page_route);