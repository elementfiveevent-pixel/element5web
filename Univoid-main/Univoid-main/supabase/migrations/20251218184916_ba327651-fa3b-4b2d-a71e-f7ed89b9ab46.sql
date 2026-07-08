-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('materials', 'blogs', 'news', 'books', 'profiles')),
  content_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reasons TEXT[] NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Authenticated users can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id OR has_role(auth.uid(), 'admin'));

-- Only admins can update reports
CREATE POLICY "Only admins can update reports"
ON public.reports
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete reports
CREATE POLICY "Only admins can delete reports"
ON public.reports
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Prevent duplicate reports from same user
CREATE UNIQUE INDEX unique_user_report ON public.reports (content_type, content_id, reporter_id);

-- Enable realtime for reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;