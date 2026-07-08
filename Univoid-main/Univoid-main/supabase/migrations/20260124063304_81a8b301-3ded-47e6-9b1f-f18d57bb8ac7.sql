-- Create efficient function to get distinct states
CREATE OR REPLACE FUNCTION public.get_college_states()
RETURNS TABLE(state text) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT c.state 
  FROM colleges c 
  WHERE c.state IS NOT NULL 
  ORDER BY c.state;
$$;

-- Create efficient function to get distinct districts for a state
CREATE OR REPLACE FUNCTION public.get_college_districts(p_state text)
RETURNS TABLE(district text) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT c.district 
  FROM colleges c 
  WHERE c.state = p_state 
    AND c.district IS NOT NULL 
  ORDER BY c.district;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_college_states() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_college_districts(text) TO anon, authenticated;