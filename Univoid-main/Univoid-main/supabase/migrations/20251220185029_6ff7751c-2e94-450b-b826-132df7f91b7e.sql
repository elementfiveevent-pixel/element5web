-- Create scholarship_reminders table to track user subscriptions
CREATE TABLE public.scholarship_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  remind_days_before INTEGER NOT NULL DEFAULT 7,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, scholarship_id)
);

-- Enable RLS
ALTER TABLE public.scholarship_reminders ENABLE ROW LEVEL SECURITY;

-- Users can view their own reminders
CREATE POLICY "Users can view own reminders"
ON public.scholarship_reminders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own reminders
CREATE POLICY "Users can create own reminders"
ON public.scholarship_reminders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reminders
CREATE POLICY "Users can delete own reminders"
ON public.scholarship_reminders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_scholarship_reminders_user ON public.scholarship_reminders(user_id);
CREATE INDEX idx_scholarship_reminders_scholarship ON public.scholarship_reminders(scholarship_id);