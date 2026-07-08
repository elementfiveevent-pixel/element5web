-- Add category to news table for filtering
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create email preferences table for personalized notifications
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_alerts BOOLEAN NOT NULL DEFAULT true,
  event_alerts BOOLEAN NOT NULL DEFAULT true,
  weekly_digest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for email preferences
CREATE POLICY "Users can view their own preferences"
ON public.email_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.email_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.email_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);
CREATE INDEX IF NOT EXISTS idx_news_status_category ON public.news(status, category);

-- Update trigger for updated_at
CREATE TRIGGER update_email_preferences_updated_at
BEFORE UPDATE ON public.email_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();