-- Create organizer identity type enum
CREATE TYPE organizer_identity_type AS ENUM (
  'individual', 'brand', 'community', 'company', 'nonprofit', 
  'school', 'university', 'event_company', 'agency', 'others'
);

-- Create event frequency enum
CREATE TYPE event_frequency_type AS ENUM (
  'one_time', 'daily', 'weekly', 'monthly', 'seasonal', 'annual'
);

-- Create event size enum
CREATE TYPE event_size_type AS ENUM (
  '1-50', '51-100', '101-500', '501-1000', '1000+'
);

-- Create organizer_profiles table
CREATE TABLE public.organizer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  website_url TEXT,
  identity_type organizer_identity_type,
  event_types TEXT[] DEFAULT '{}',
  event_frequency event_frequency_type,
  average_event_size event_size_type,
  primary_goals TEXT[] DEFAULT '{}',
  discovery_source TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  follower_count INTEGER NOT NULL DEFAULT 0,
  events_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create organizer_followers table
CREATE TABLE public.organizer_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organizer_id, user_id)
);

-- Function to generate organizer slug
CREATE OR REPLACE FUNCTION public.generate_organizer_slug(organizer_name TEXT, organizer_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := LOWER(TRIM(organizer_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^\w\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  IF LENGTH(base_slug) > 50 THEN
    base_slug := LEFT(base_slug, 50);
    base_slug := TRIM(BOTH '-' FROM base_slug);
  END IF;
  
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.organizer_profiles WHERE slug = final_slug AND id != organizer_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Trigger to auto-generate slug
CREATE OR REPLACE FUNCTION public.set_organizer_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_organizer_slug(NEW.name, COALESCE(NEW.id, gen_random_uuid()));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_organizer_slug_trigger
BEFORE INSERT OR UPDATE ON public.organizer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_organizer_slug();

-- Trigger to update follower count
CREATE OR REPLACE FUNCTION public.update_organizer_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.organizer_profiles 
    SET follower_count = follower_count + 1 
    WHERE id = NEW.organizer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.organizer_profiles 
    SET follower_count = GREATEST(0, follower_count - 1) 
    WHERE id = OLD.organizer_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_follower_count_trigger
AFTER INSERT OR DELETE ON public.organizer_followers
FOR EACH ROW
EXECUTE FUNCTION public.update_organizer_follower_count();

-- Function to check if user has organizer profile
CREATE OR REPLACE FUNCTION public.has_organizer_profile(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.organizer_profiles WHERE user_id = p_user_id);
END;
$$;

-- Function to toggle follow
CREATE OR REPLACE FUNCTION public.toggle_organizer_follow(p_organizer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM organizer_followers 
    WHERE organizer_id = p_organizer_id AND user_id = v_user_id
  ) INTO v_exists;
  
  IF v_exists THEN
    DELETE FROM organizer_followers 
    WHERE organizer_id = p_organizer_id AND user_id = v_user_id;
    RETURN false;
  ELSE
    INSERT INTO organizer_followers (organizer_id, user_id) 
    VALUES (p_organizer_id, v_user_id);
    RETURN true;
  END IF;
END;
$$;

-- Enable RLS
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizer_profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.organizer_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can create their own organizer profile"
ON public.organizer_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organizer profile"
ON public.organizer_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own organizer profile"
ON public.organizer_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Admin can update any profile (for verification)
CREATE POLICY "Admins can update any organizer profile"
ON public.organizer_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'admin_assistant')
  )
);

-- RLS Policies for organizer_followers
CREATE POLICY "Followers are viewable by everyone"
ON public.organizer_followers FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own follows"
ON public.organizer_followers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow"
ON public.organizer_followers FOR DELETE
USING (auth.uid() = user_id);

-- Update updated_at trigger
CREATE TRIGGER update_organizer_profiles_updated_at
BEFORE UPDATE ON public.organizer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();