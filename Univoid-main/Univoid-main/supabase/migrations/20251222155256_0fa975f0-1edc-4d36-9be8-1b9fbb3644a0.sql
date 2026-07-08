-- Create a batch function to get multiple contributor names at once
CREATE OR REPLACE FUNCTION public.get_contributor_names(user_ids uuid[])
RETURNS TABLE(user_id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id as user_id, p.full_name
  FROM public.profiles p
  WHERE p.id = ANY(user_ids);
$$;