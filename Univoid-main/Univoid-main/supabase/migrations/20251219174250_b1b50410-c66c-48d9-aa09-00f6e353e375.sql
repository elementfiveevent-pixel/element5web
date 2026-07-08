-- Create enum for event status
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');

-- Create enum for ticket status  
CREATE TYPE public.ticket_status AS ENUM ('pending', 'approved', 'rejected', 'used');

-- Create enum for application status
CREATE TYPE public.organizer_application_status AS ENUM ('pending', 'approved', 'rejected');

-- Organizer Applications table
CREATE TABLE public.organizer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proof_url TEXT NOT NULL,
  reason TEXT,
  status organizer_application_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  flyer_url TEXT,
  category TEXT NOT NULL,
  event_type TEXT NOT NULL,
  is_location_decided BOOLEAN NOT NULL DEFAULT false,
  venue_name TEXT,
  venue_address TEXT,
  maps_link TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  price NUMERIC(10,2) DEFAULT 0,
  upi_qr_url TEXT,
  upi_vpa TEXT,
  terms_conditions TEXT,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  max_capacity INTEGER,
  registrations_count INTEGER NOT NULL DEFAULT 0,
  status event_status NOT NULL DEFAULT 'draft',
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event Registrations table
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_data JSONB DEFAULT '{}'::jsonb,
  payment_screenshot_url TEXT,
  payment_status ticket_status NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  team_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Event Tickets table
CREATE TABLE public.event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE UNIQUE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event Materials table (for rulebooks, schedules)
CREATE TABLE public.event_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_materials ENABLE ROW LEVEL SECURITY;

-- Organizer Applications Policies
CREATE POLICY "Users can view own applications" ON public.organizer_applications
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create applications" ON public.organizer_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update applications" ON public.organizer_applications
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Events Policies
CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT USING (status = 'published' OR organizer_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizers can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = organizer_id AND (has_role(auth.uid(), 'organizer') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Organizers can update own events" ON public.events
  FOR UPDATE USING (organizer_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizers can delete own events" ON public.events
  FOR DELETE USING (organizer_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Event Registrations Policies
CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM events WHERE events.id = event_registrations.event_id AND events.organizer_id = auth.uid()) OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authenticated users can register" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can update registrations" ON public.event_registrations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_registrations.event_id AND events.organizer_id = auth.uid()) OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update own registration" ON public.event_registrations
  FOR UPDATE USING (user_id = auth.uid());

-- Event Tickets Policies
CREATE POLICY "Users can view own tickets" ON public.event_tickets
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM events WHERE events.id = event_tickets.event_id AND events.organizer_id = auth.uid()) OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System creates tickets" ON public.event_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizers can update tickets" ON public.event_tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_tickets.event_id AND events.organizer_id = auth.uid()) OR
    has_role(auth.uid(), 'admin')
  );

-- Event Materials Policies
CREATE POLICY "Anyone can view materials of published events" ON public.event_materials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_materials.event_id AND events.status = 'published') OR
    EXISTS (SELECT 1 FROM events WHERE events.id = event_materials.event_id AND events.organizer_id = auth.uid()) OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Organizers can manage materials" ON public.event_materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_materials.event_id AND events.organizer_id = auth.uid()) OR
    has_role(auth.uid(), 'admin')
  );

-- Function to generate QR code (unique string)
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

-- Trigger to create ticket on registration approval
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

CREATE TRIGGER on_registration_approval
  AFTER INSERT OR UPDATE OF payment_status ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ticket_on_approval();

-- Award XP for event attendance
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

-- Function to update registration count
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

CREATE TRIGGER update_event_registrations
  AFTER INSERT OR DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_registration_count();

-- Updated_at triggers
CREATE TRIGGER update_organizer_applications_updated_at
  BEFORE UPDATE ON public.organizer_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();