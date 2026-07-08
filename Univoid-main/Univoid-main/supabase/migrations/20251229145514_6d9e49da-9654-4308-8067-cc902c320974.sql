-- Create volunteer attendance tracking table
CREATE TABLE public.volunteer_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_id UUID REFERENCES public.event_volunteer_invites(id) ON DELETE SET NULL,
  check_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out_at TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN check_out_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (check_out_at - check_in_at)) / 3600.0
      ELSE NULL
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.volunteer_attendance ENABLE ROW LEVEL SECURITY;

-- Volunteers can view their own attendance
CREATE POLICY "Volunteers can view own attendance"
ON public.volunteer_attendance FOR SELECT
USING (auth.uid() = user_id);

-- Volunteers can insert their own check-in
CREATE POLICY "Volunteers can check in"
ON public.volunteer_attendance FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.event_volunteer_invites 
    WHERE event_id = volunteer_attendance.event_id 
    AND user_id = auth.uid() 
    AND status = 'accepted'
  )
);

-- Volunteers can update their own attendance (for check-out)
CREATE POLICY "Volunteers can check out"
ON public.volunteer_attendance FOR UPDATE
USING (auth.uid() = user_id AND check_out_at IS NULL);

-- Organizers can view attendance for their events
CREATE POLICY "Organizers can view event attendance"
ON public.volunteer_attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = volunteer_attendance.event_id 
    AND organizer_id = auth.uid()
  )
);

-- Admins can view all attendance
CREATE POLICY "Admins can view all attendance"
ON public.volunteer_attendance FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_volunteer_attendance_event_user ON public.volunteer_attendance(event_id, user_id);
CREATE INDEX idx_volunteer_attendance_user ON public.volunteer_attendance(user_id);