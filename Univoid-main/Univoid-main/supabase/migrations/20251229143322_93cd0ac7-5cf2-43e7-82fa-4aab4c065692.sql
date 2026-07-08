-- Create enum for volunteer invite roles
CREATE TYPE public.volunteer_invite_role AS ENUM ('entry', 'qr_checkin', 'help_desk', 'all');

-- Create enum for volunteer invite status
CREATE TYPE public.volunteer_invite_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create the event_volunteer_invites table
CREATE TABLE public.event_volunteer_invites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    invited_by UUID NOT NULL,
    role volunteer_invite_role NOT NULL DEFAULT 'all',
    status volunteer_invite_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_volunteer_invites ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Organizers can view invites for their events
CREATE POLICY "Organizers can view invites for their events"
ON public.event_volunteer_invites
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = event_volunteer_invites.event_id 
        AND events.organizer_id = auth.uid()
    )
    OR user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
);

-- Organizers can create invites for their events
CREATE POLICY "Organizers can create invites for their events"
ON public.event_volunteer_invites
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = event_volunteer_invites.event_id 
        AND events.organizer_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can update their own invites (accept/reject) OR organizers can update
CREATE POLICY "Users can update own invites or organizers can manage"
ON public.event_volunteer_invites
FOR UPDATE
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = event_volunteer_invites.event_id 
        AND events.organizer_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
);

-- Organizers can delete invites for their events
CREATE POLICY "Organizers can delete invites for their events"
ON public.event_volunteer_invites
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = event_volunteer_invites.event_id 
        AND events.organizer_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_volunteer_invite_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        NEW.accepted_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_event_volunteer_invites_updated_at
BEFORE UPDATE ON public.event_volunteer_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_volunteer_invite_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_volunteer_invites_event_id ON public.event_volunteer_invites(event_id);
CREATE INDEX idx_volunteer_invites_user_id ON public.event_volunteer_invites(user_id);
CREATE INDEX idx_volunteer_invites_status ON public.event_volunteer_invites(status);

-- Enable realtime for volunteer invites
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_volunteer_invites;