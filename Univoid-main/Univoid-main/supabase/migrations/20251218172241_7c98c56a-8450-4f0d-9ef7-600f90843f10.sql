-- Fix XP transactions security: Only allow inserts through the award_xp function (SECURITY DEFINER)
-- Direct inserts from users should be blocked
CREATE POLICY "No direct inserts allowed"
ON public.xp_transactions
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Note: The award_xp function uses SECURITY DEFINER which bypasses RLS,
-- so it can still insert records while blocking direct user inserts