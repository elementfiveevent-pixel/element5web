-- Reset XP for admin account
UPDATE public.profiles 
SET total_xp = 0 
WHERE email = 'heerpatel1032@gmail.com';

-- Delete any existing XP transactions for this account
DELETE FROM public.xp_transactions 
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'heerpatel1032@gmail.com');

-- Update award_xp function to exclude admin account
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _amount integer, _reason text, _content_type text DEFAULT NULL::text, _content_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_email text;
BEGIN
  -- Require admin role
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can award XP';
  END IF;
  
  -- Get user email to check exclusion
  SELECT email INTO v_user_email FROM public.profiles WHERE id = _user_id;
  
  -- Exclude admin account from XP system
  IF v_user_email = 'heerpatel1032@gmail.com' THEN
    RETURN;
  END IF;
  
  -- Check if XP was already awarded for this specific content
  IF _content_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.xp_transactions 
    WHERE content_id = _content_id 
    AND user_id = _user_id
    AND reason = _reason
  ) THEN
    -- Already awarded, skip
    RETURN;
  END IF;
  
  INSERT INTO public.xp_transactions (user_id, amount, reason, content_type, content_id)
  VALUES (_user_id, _amount, _reason, _content_type, _content_id);
  
  UPDATE public.profiles
  SET total_xp = total_xp + _amount
  WHERE id = _user_id;
END;
$function$;