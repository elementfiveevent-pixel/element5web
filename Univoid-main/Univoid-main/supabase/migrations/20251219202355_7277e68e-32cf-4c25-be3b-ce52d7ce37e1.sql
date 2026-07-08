-- Update is_admin_or_assistant function to use text comparison for new enum value
CREATE OR REPLACE FUNCTION public.is_admin_or_assistant(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'admin_assistant')
  )
$$;