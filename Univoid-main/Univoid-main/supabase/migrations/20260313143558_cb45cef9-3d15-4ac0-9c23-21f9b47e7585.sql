
-- 1. Create increment_event_views function
CREATE OR REPLACE FUNCTION public.increment_event_views(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE events
  SET views_count = views_count + 1
  WHERE id = p_event_id;
END;
$$;

-- 2. Create event_checkout_visits table for tracking checkout/registration form opens
CREATE TABLE public.event_checkout_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_event_checkout_visits_event_id ON public.event_checkout_visits(event_id);
CREATE INDEX idx_event_checkout_visits_created_at ON public.event_checkout_visits(created_at);

-- Enable RLS
ALTER TABLE public.event_checkout_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (tracking visits)
CREATE POLICY "Anyone can record checkout visit"
  ON public.event_checkout_visits FOR INSERT
  WITH CHECK (true);

-- Organizers and admins can read checkout visits for their events
CREATE POLICY "Organizers can read their event checkout visits"
  ON public.event_checkout_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_checkout_visits.event_id 
      AND e.organizer_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- 3. Function to record checkout visit and return void
CREATE OR REPLACE FUNCTION public.record_checkout_visit(p_event_id uuid, p_session_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.event_checkout_visits (event_id, user_id, session_id)
  VALUES (p_event_id, auth.uid(), p_session_id);
END;
$$;

-- 4. Function to get checkout analytics for an event
CREATE OR REPLACE FUNCTION public.get_event_checkout_analytics(p_event_id uuid)
RETURNS TABLE(
  total_checkout_views bigint,
  unique_users bigint,
  anonymous_views bigint,
  checkout_leads jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_checkout_views,
    COUNT(DISTINCT cv.user_id)::bigint as unique_users,
    COUNT(*) FILTER (WHERE cv.user_id IS NULL)::bigint as anonymous_views,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'user_id', cv.user_id,
          'full_name', COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', 'Anonymous'),
          'email', COALESCE(p.email, au.email),
          'visited_at', cv.created_at
        )
      ) FILTER (WHERE cv.user_id IS NOT NULL),
      '[]'::jsonb
    ) as checkout_leads
  FROM event_checkout_visits cv
  LEFT JOIN profiles p ON p.id = cv.user_id
  LEFT JOIN auth.users au ON au.id = cv.user_id
  WHERE cv.event_id = p_event_id;
END;
$$;
