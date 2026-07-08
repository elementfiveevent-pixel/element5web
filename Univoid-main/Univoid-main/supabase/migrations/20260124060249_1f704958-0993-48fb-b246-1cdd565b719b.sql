-- Create colleges table with proper structure and indexes
CREATE TABLE public.colleges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university text NOT NULL,
  college_name text NOT NULL,
  college_type text,
  state text NOT NULL,
  district text NOT NULL,
  is_popular boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Prevent duplicate entries
  CONSTRAINT unique_college_entry UNIQUE (college_name, university, state, district)
);

-- Enable RLS
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Anyone can read colleges (public data)
CREATE POLICY "Anyone can read colleges"
  ON public.colleges FOR SELECT
  USING (true);

-- Only admins can manage colleges
CREATE POLICY "Admins can manage colleges"
  ON public.colleges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for fast filtering and search
CREATE INDEX idx_colleges_state ON public.colleges(state);
CREATE INDEX idx_colleges_district ON public.colleges(district);
CREATE INDEX idx_colleges_state_district ON public.colleges(state, district);
CREATE INDEX idx_colleges_name_search ON public.colleges USING gin(to_tsvector('english', college_name));
CREATE INDEX idx_colleges_name_ilike ON public.colleges(lower(college_name) text_pattern_ops);
CREATE INDEX idx_colleges_popular ON public.colleges(is_popular) WHERE is_popular = true;

-- Function to get unique states
CREATE OR REPLACE FUNCTION public.get_college_states()
RETURNS TABLE(state text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT c.state 
  FROM colleges c 
  ORDER BY c.state;
$$;

-- Function to get districts for a state
CREATE OR REPLACE FUNCTION public.get_college_districts(p_state text)
RETURNS TABLE(district text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT c.district 
  FROM colleges c 
  WHERE c.state = p_state
  ORDER BY c.district;
$$;

-- Function to search colleges with filters
CREATE OR REPLACE FUNCTION public.search_colleges(
  p_state text DEFAULT NULL,
  p_district text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  university text,
  college_name text,
  college_type text,
  state text,
  district text,
  is_popular boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.university,
    c.college_name,
    c.college_type,
    c.state,
    c.district,
    c.is_popular
  FROM colleges c
  WHERE 
    (p_state IS NULL OR c.state = p_state)
    AND (p_district IS NULL OR c.district = p_district)
    AND (p_search IS NULL OR p_search = '' OR c.college_name ILIKE '%' || p_search || '%')
  ORDER BY 
    c.is_popular DESC,
    c.college_name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to count colleges with filters
CREATE OR REPLACE FUNCTION public.count_colleges(
  p_state text DEFAULT NULL,
  p_district text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_count
  FROM colleges c
  WHERE 
    (p_state IS NULL OR c.state = p_state)
    AND (p_district IS NULL OR c.district = p_district)
    AND (p_search IS NULL OR p_search = '' OR c.college_name ILIKE '%' || p_search || '%');
  
  RETURN v_count;
END;
$$;