-- Update existing scholarships with 2026 deadlines to use proper deadline dates
UPDATE public.scholarships 
SET deadline = '2025-12-31', 
    deadline_status = 'active',
    updated_at = now()
WHERE deadline >= '2026-01-01';

-- Create or replace auto_expire_scholarships function to mark expired scholarships
CREATE OR REPLACE FUNCTION public.auto_expire_scholarships()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark scholarships as expired if deadline has passed
  UPDATE public.scholarships
  SET deadline_status = 'expired',
      updated_at = now()
  WHERE deadline < CURRENT_DATE
    AND deadline_status = 'active';
END;
$$;

-- Allow admins to fully manage scholarships (add, update, delete)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Admins can insert scholarships" ON public.scholarships;
DROP POLICY IF EXISTS "Admins can update all scholarships" ON public.scholarships;
DROP POLICY IF EXISTS "Admins can delete all scholarships" ON public.scholarships;

-- Create comprehensive admin policies
CREATE POLICY "Admins can insert scholarships" 
ON public.scholarships 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all scholarships" 
ON public.scholarships 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all scholarships" 
ON public.scholarships 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));