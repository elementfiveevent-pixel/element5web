-- Fix materials SELECT policy to only show approved content to public
DROP POLICY IF EXISTS "All materials are viewable by everyone" ON materials;

CREATE POLICY "Approved materials are public, owners see all own"
ON materials
FOR SELECT
USING (
  status = 'approved' 
  OR auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_admin_or_assistant(auth.uid())
);

-- Fix news SELECT policy to only show approved content to public  
DROP POLICY IF EXISTS "All news are viewable by everyone" ON news;

CREATE POLICY "Approved news are public, owners see all own"
ON news
FOR SELECT
USING (
  status = 'approved' 
  OR auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_admin_or_assistant(auth.uid())
);