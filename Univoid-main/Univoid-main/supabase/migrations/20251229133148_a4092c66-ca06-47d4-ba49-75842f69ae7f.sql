-- Create volunteer roles table
CREATE TABLE public.volunteer_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slots_available INTEGER NOT NULL DEFAULT 1,
  slots_filled INTEGER NOT NULL DEFAULT 0,
  responsibilities TEXT[],
  perks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create volunteer assignments table
CREATE TABLE public.volunteer_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.volunteer_roles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  notes TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate assignments
ALTER TABLE public.volunteer_assignments ADD CONSTRAINT unique_volunteer_assignment UNIQUE (role_id, user_id);

-- Enable RLS
ALTER TABLE public.volunteer_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for volunteer_roles
CREATE POLICY "Anyone can view volunteer roles for published events"
ON public.volunteer_roles FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND status = 'published')
);

CREATE POLICY "Organizers can manage their event volunteer roles"
ON public.volunteer_roles FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
);

-- RLS policies for volunteer_assignments
CREATE POLICY "Users can view their own assignments"
ON public.volunteer_assignments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Organizers can view assignments for their events"
ON public.volunteer_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_roles vr
    JOIN public.events e ON e.id = vr.event_id
    WHERE vr.id = role_id AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can apply for volunteer roles"
ON public.volunteer_assignments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can manage assignments for their events"
ON public.volunteer_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_roles vr
    JOIN public.events e ON e.id = vr.event_id
    WHERE vr.id = role_id AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Organizers can delete assignments for their events"
ON public.volunteer_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_roles vr
    JOIN public.events e ON e.id = vr.event_id
    WHERE vr.id = role_id AND e.organizer_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_volunteer_roles_event ON public.volunteer_roles(event_id);
CREATE INDEX idx_volunteer_assignments_role ON public.volunteer_assignments(role_id);
CREATE INDEX idx_volunteer_assignments_user ON public.volunteer_assignments(user_id);

-- Trigger to update slots_filled
CREATE OR REPLACE FUNCTION public.update_volunteer_slots()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE public.volunteer_roles SET slots_filled = slots_filled + 1 WHERE id = NEW.role_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
      UPDATE public.volunteer_roles SET slots_filled = slots_filled + 1 WHERE id = NEW.role_id;
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
      UPDATE public.volunteer_roles SET slots_filled = GREATEST(0, slots_filled - 1) WHERE id = NEW.role_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE public.volunteer_roles SET slots_filled = GREATEST(0, slots_filled - 1) WHERE id = OLD.role_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_volunteer_slots_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.volunteer_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_volunteer_slots();