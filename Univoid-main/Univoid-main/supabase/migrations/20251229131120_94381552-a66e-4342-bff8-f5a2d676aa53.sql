-- Create table for clubs/organizations
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for event-club associations with pricing
CREATE TABLE public.event_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  member_price NUMERIC NOT NULL DEFAULT 0,
  member_benefits TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, club_id)
);

-- Create table for club memberships
CREATE TABLE public.club_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  membership_id TEXT, -- External membership ID if any
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Enable RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Clubs policies
CREATE POLICY "Anyone can view clubs"
ON public.clubs FOR SELECT
USING (true);

CREATE POLICY "Organizers can create clubs"
ON public.clubs FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('organizer', 'admin'))
);

CREATE POLICY "Creators and admins can update clubs"
ON public.clubs FOR UPDATE
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clubs"
ON public.clubs FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Event clubs policies
CREATE POLICY "Anyone can view event clubs for published events"
ON public.event_clubs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_clubs.event_id 
    AND events.status = 'published'
  )
);

CREATE POLICY "Event organizers can manage event clubs"
ON public.event_clubs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_clubs.event_id 
    AND events.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_clubs.event_id 
    AND events.organizer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all event clubs"
ON public.event_clubs FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Club members policies
CREATE POLICY "Users can view their own memberships"
ON public.club_members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Event organizers can view members for their events"
ON public.club_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_clubs ec
    JOIN public.events e ON e.id = ec.event_id
    WHERE ec.club_id = club_members.club_id
    AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all members"
ON public.club_members FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can claim membership"
ON public.club_members FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and organizers can verify memberships"
ON public.club_members FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.event_clubs ec
    JOIN public.events e ON e.id = ec.event_id
    WHERE ec.club_id = club_members.club_id
    AND e.organizer_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_event_clubs_event ON public.event_clubs(event_id);
CREATE INDEX idx_event_clubs_club ON public.event_clubs(club_id);
CREATE INDEX idx_club_members_club ON public.club_members(club_id);
CREATE INDEX idx_club_members_user ON public.club_members(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_clubs_updated_at
BEFORE UPDATE ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();