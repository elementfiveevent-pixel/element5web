-- Create dedicated scholarships table for India-only verified scholarships
CREATE TABLE public.scholarships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_domain TEXT,
  deadline DATE,
  deadline_status TEXT DEFAULT 'active' CHECK (deadline_status IN ('active', 'expired', 'needs_review')),
  
  -- India-specific fields
  eligible_states TEXT[] DEFAULT '{}',
  is_all_india BOOLEAN DEFAULT false,
  eligible_courses TEXT[] DEFAULT '{}',
  eligible_categories TEXT[] DEFAULT '{}',
  
  -- Application details
  application_link TEXT,
  official_source BOOLEAN DEFAULT false,
  
  -- Verification
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_rejected')),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved scholarships
CREATE POLICY "Anyone can view approved scholarships"
ON public.scholarships FOR SELECT
USING (status = 'approved' OR has_role(auth.uid(), 'admin'::app_role));

-- Only system/admins can insert
CREATE POLICY "System and admins can insert scholarships"
ON public.scholarships FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR created_by IS NULL);

-- Only admins can update
CREATE POLICY "Admins can update scholarships"
ON public.scholarships FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete scholarships"
ON public.scholarships FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for fast queries
CREATE INDEX idx_scholarships_status ON public.scholarships(status);
CREATE INDEX idx_scholarships_deadline ON public.scholarships(deadline);
CREATE INDEX idx_scholarships_states ON public.scholarships USING GIN(eligible_states);
CREATE INDEX idx_scholarships_is_all_india ON public.scholarships(is_all_india);

-- Trigger for updated_at
CREATE TRIGGER update_scholarships_updated_at
BEFORE UPDATE ON public.scholarships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-expire scholarships
CREATE OR REPLACE FUNCTION public.auto_expire_scholarships()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.scholarships
  SET deadline_status = 'expired'
  WHERE deadline < CURRENT_DATE
  AND deadline_status = 'active';
END;
$$;

-- Enable realtime for scholarships
ALTER PUBLICATION supabase_realtime ADD TABLE public.scholarships;