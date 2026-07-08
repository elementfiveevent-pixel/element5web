-- Create event_category enum
CREATE TYPE public.event_category AS ENUM (
  'technology',
  'cultural',
  'sports',
  'placement',
  'workshop',
  'seminar',
  'meetup',
  'entrepreneurship',
  'social',
  'other'
);

-- Create event_type enum
CREATE TYPE public.event_type AS ENUM (
  'college_event',
  'hackathon',
  'competition',
  'party',
  'seminar_workshop',
  'meetup',
  'other'
);

-- Create registration_mode enum
CREATE TYPE public.registration_mode AS ENUM ('individual', 'team');

-- Create payment_status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');

-- Create ticket_status enum
CREATE TYPE public.ticket_status AS ENUM ('valid', 'used', 'cancelled');

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rules TEXT,
  terms_conditions TEXT,
  banner_image_url TEXT NOT NULL,
  category event_category NOT NULL,
  event_type event_type NOT NULL,
  registration_mode registration_mode NOT NULL DEFAULT 'individual',
  city TEXT NOT NULL,
  location_finalized BOOLEAN NOT NULL DEFAULT false,
  venue_name TEXT,
  venue_address TEXT,
  venue_landmark TEXT,
  google_maps_link TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  ticket_price NUMERIC(10,2),
  organizer_upi_id TEXT,
  organizer_qr_image_url TEXT,
  min_team_size INTEGER DEFAULT 1,
  max_team_size INTEGER DEFAULT 1,
  max_registrations INTEGER,
  organizer_instagram TEXT,
  organizer_linkedin TEXT,
  organizer_twitter TEXT,
  organizer_facebook TEXT,
  organizer_youtube TEXT,
  organizer_website TEXT,
  status public.content_status NOT NULL DEFAULT 'pending',
  views_count INTEGER NOT NULL DEFAULT 0,
  registrations_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_datetime > start_datetime),
  CONSTRAINT valid_team_size CHECK (max_team_size >= min_team_size),
  CONSTRAINT paid_event_requires_price CHECK (
    (is_paid = false) OR 
    (is_paid = true AND ticket_price IS NOT NULL AND ticket_price > 0)
  )
);

-- Create custom registration questions table
CREATE TABLE public.event_custom_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event registrations table
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT,
  is_team_leader BOOLEAN NOT NULL DEFAULT true,
  team_leader_id UUID REFERENCES public.event_registrations(id),
  payment_status payment_status,
  payment_screenshot_url TEXT,
  payment_reviewed_at TIMESTAMP WITH TIME ZONE,
  payment_notes TEXT,
  custom_answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create event tickets table
CREATE TABLE public.event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE,
  status ticket_status NOT NULL DEFAULT 'valid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event attendance table
CREATE TABLE public.event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_in_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(ticket_id)
);

-- Create event materials table
CREATE TABLE public.event_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  views_count INTEGER NOT NULL DEFAULT 0,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event updates table (for organizer announcements)
CREATE TABLE public.event_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organizer applications table
CREATE TABLE public.organizer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  organization_name TEXT,
  organization_email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_city ON public.events(city);
CREATE INDEX idx_events_start_datetime ON public.events(start_datetime);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON public.event_registrations(user_id);
CREATE INDEX idx_event_tickets_event ON public.event_tickets(event_id);
CREATE INDEX idx_event_tickets_qr ON public.event_tickets(qr_code);
CREATE INDEX idx_event_attendance_event ON public.event_attendance(event_id);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_custom_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_applications ENABLE ROW LEVEL SECURITY;

-- Events RLS policies
CREATE POLICY "Approved events are viewable by everyone"
ON public.events FOR SELECT
USING (status = 'approved');

CREATE POLICY "Organizers can view their own events"
ON public.events FOR SELECT
USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can view all events"
ON public.events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizers can create events"
ON public.events FOR INSERT
WITH CHECK (
  auth.uid() = organizer_id AND 
  public.has_role(auth.uid(), 'organizer')
);

CREATE POLICY "Organizers can update their own events"
ON public.events FOR UPDATE
USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own events"
ON public.events FOR DELETE
USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can delete any events"
ON public.events FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Event custom questions RLS
CREATE POLICY "Questions viewable with event"
ON public.event_custom_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND (e.status = 'approved' OR e.organizer_id = auth.uid())
  )
);

CREATE POLICY "Organizers can manage their event questions"
ON public.event_custom_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

-- Event registrations RLS
CREATE POLICY "Users can view their own registrations"
ON public.event_registrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view registrations for their events"
ON public.event_registrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can register for events"
ON public.event_registrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations"
ON public.event_registrations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Organizers can update registrations for their events"
ON public.event_registrations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

-- Event tickets RLS
CREATE POLICY "Users can view their own tickets"
ON public.event_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view tickets for their events"
ON public.event_tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

-- Event attendance RLS
CREATE POLICY "Users can view their own attendance"
ON public.event_attendance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view and manage attendance for their events"
ON public.event_attendance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

-- Event materials RLS
CREATE POLICY "Event materials are viewable by everyone"
ON public.event_materials FOR SELECT
USING (true);

CREATE POLICY "Organizers can manage materials for their events"
ON public.event_materials FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

-- Event updates RLS
CREATE POLICY "Event updates are viewable by everyone"
ON public.event_updates FOR SELECT
USING (true);

CREATE POLICY "Organizers can create updates for their events"
ON public.event_updates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.organizer_id = auth.uid()
  )
);

-- Organizer applications RLS
CREATE POLICY "Users can view their own applications"
ON public.organizer_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
ON public.organizer_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
ON public.organizer_applications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications"
ON public.organizer_applications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to generate unique QR code
CREATE OR REPLACE FUNCTION public.generate_ticket_qr()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  qr_code TEXT;
BEGIN
  qr_code := encode(gen_random_bytes(32), 'hex');
  RETURN qr_code;
END;
$$;

-- Create function to create ticket after payment approval
CREATE OR REPLACE FUNCTION public.create_ticket_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create ticket when payment is approved (or for free events)
  IF NEW.payment_status = 'approved' OR (
    SELECT NOT is_paid FROM public.events WHERE id = NEW.event_id
  ) THEN
    -- Check if ticket doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM public.event_tickets 
      WHERE registration_id = NEW.id
    ) THEN
      INSERT INTO public.event_tickets (
        registration_id,
        event_id,
        user_id,
        qr_code
      ) VALUES (
        NEW.id,
        NEW.event_id,
        NEW.user_id,
        public.generate_ticket_qr()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for ticket generation
CREATE TRIGGER trigger_create_ticket_on_approval
AFTER INSERT OR UPDATE OF payment_status ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.create_ticket_on_approval();

-- Create function to award XP on event attendance
CREATE OR REPLACE FUNCTION public.award_attendance_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award 25 XP for event attendance
  PERFORM public.award_xp(
    NEW.user_id,
    25,
    'event_attendance',
    'event',
    NEW.event_id
  );
  RETURN NEW;
END;
$$;

-- Create trigger for attendance XP
CREATE TRIGGER trigger_award_attendance_xp
AFTER INSERT ON public.event_attendance
FOR EACH ROW
EXECUTE FUNCTION public.award_attendance_xp();

-- Create function to update registration count
CREATE OR REPLACE FUNCTION public.update_event_registration_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET registrations_count = registrations_count + 1
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET registrations_count = registrations_count - 1
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for registration count
CREATE TRIGGER trigger_update_registration_count
AFTER INSERT OR DELETE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_event_registration_count();

-- Create function to approve organizer and assign role
CREATE OR REPLACE FUNCTION public.approve_organizer(application_id UUID, admin_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  applicant_id UUID;
BEGIN
  -- Get applicant user_id
  SELECT user_id INTO applicant_id
  FROM public.organizer_applications
  WHERE id = application_id;
  
  -- Update application status
  UPDATE public.organizer_applications
  SET status = 'approved',
      reviewed_by = admin_id,
      reviewed_at = now()
  WHERE id = application_id;
  
  -- Assign organizer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (applicant_id, 'organizer')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Create storage bucket for event assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-assets', 'event-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event assets
CREATE POLICY "Event assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-assets');

CREATE POLICY "Organizers can upload event assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-assets' AND 
  public.has_role(auth.uid(), 'organizer')
);

CREATE POLICY "Users can upload their payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-assets' AND 
  (storage.foldername(name))[1] = 'payments'
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_updates;

-- Add updated_at trigger for events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for registrations
CREATE TRIGGER update_registrations_updated_at
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();