
-- Create enum for content status
CREATE TYPE public.content_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  college_name TEXT NOT NULL,
  course_stream TEXT NOT NULL,
  year_semester TEXT NOT NULL,
  mobile_number TEXT,
  profile_photo_url TEXT,
  total_xp INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status content_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create blogs table
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status content_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create news table
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  external_link TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status content_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  condition TEXT,
  image_urls TEXT[] DEFAULT '{}',
  seller_mobile TEXT NOT NULL,
  seller_address TEXT NOT NULL,
  seller_email TEXT NOT NULL,
  is_sold BOOLEAN DEFAULT false NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status content_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create XP transactions table
CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  content_type TEXT,
  content_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's public profile info
CREATE OR REPLACE FUNCTION public.get_contributor_name(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT full_name FROM public.profiles WHERE id = user_id
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, college_name, course_stream, year_semester, mobile_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'college_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'course_stream', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'year_semester', ''),
    NEW.raw_user_meta_data ->> 'mobile_number'
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to award XP and update user total
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id UUID,
  _amount INTEGER,
  _reason TEXT,
  _content_type TEXT DEFAULT NULL,
  _content_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert XP transaction
  INSERT INTO public.xp_transactions (user_id, amount, reason, content_type, content_id)
  VALUES (_user_id, _amount, _reason, _content_type, _content_id);
  
  -- Update user's total XP
  UPDATE public.profiles
  SET total_xp = total_xp + _amount
  WHERE id = _user_id;
END;
$$;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles (only admins can view/modify)
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for materials
CREATE POLICY "Approved materials are viewable by everyone"
  ON public.materials FOR SELECT
  USING (status = 'approved' OR (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Authenticated users can create materials"
  ON public.materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own materials"
  ON public.materials FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete materials"
  ON public.materials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for blogs
CREATE POLICY "Approved blogs are viewable by everyone"
  ON public.blogs FOR SELECT
  USING (status = 'approved' OR (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Authenticated users can create blogs"
  ON public.blogs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own blogs"
  ON public.blogs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blogs"
  ON public.blogs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for news
CREATE POLICY "Approved news are viewable by everyone"
  ON public.news FOR SELECT
  USING (status = 'approved' OR (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Authenticated users can create news"
  ON public.news FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own news"
  ON public.news FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete news"
  ON public.news FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for books
CREATE POLICY "Approved books are viewable by everyone"
  ON public.books FOR SELECT
  USING (status = 'approved' OR (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Authenticated users can create books"
  ON public.books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own books"
  ON public.books FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete books"
  ON public.books FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for xp_transactions
CREATE POLICY "Users can view own XP transactions"
  ON public.xp_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_materials_status ON public.materials(status);
CREATE INDEX idx_materials_created_by ON public.materials(created_by);
CREATE INDEX idx_blogs_status ON public.blogs(status);
CREATE INDEX idx_blogs_created_by ON public.blogs(created_by);
CREATE INDEX idx_news_status ON public.news(status);
CREATE INDEX idx_news_created_by ON public.news(created_by);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_created_by ON public.books(created_by);
CREATE INDEX idx_profiles_total_xp ON public.profiles(total_xp DESC);
CREATE INDEX idx_profiles_college ON public.profiles(college_name);
CREATE INDEX idx_xp_transactions_user ON public.xp_transactions(user_id);
