-- Make profile fields nullable to support OAuth users who don't provide this data initially
ALTER TABLE public.profiles 
  ALTER COLUMN college_name DROP NOT NULL,
  ALTER COLUMN course_stream DROP NOT NULL,
  ALTER COLUMN year_semester DROP NOT NULL;

-- Update the handle_new_user trigger to handle OAuth users gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    college_name,
    course_stream,
    year_semester,
    mobile_number
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'college_name', 'Not specified'),
    COALESCE(NEW.raw_user_meta_data->>'course_stream', 'Not specified'),
    COALESCE(NEW.raw_user_meta_data->>'year_semester', 'Not specified'),
    NEW.raw_user_meta_data->>'mobile_number'
  );
  RETURN NEW;
END;
$$;