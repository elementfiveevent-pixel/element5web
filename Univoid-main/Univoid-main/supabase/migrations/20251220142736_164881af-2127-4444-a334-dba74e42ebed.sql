-- Create lookup tables for searchable dropdowns
-- These tables will store universities, states, cities, branches, and courses

-- States table (Indian states + UTs)
CREATE TABLE public.lookup_states (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  code text,
  is_popular boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Cities table (linked to states)
CREATE TABLE public.lookup_cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  state_id uuid REFERENCES public.lookup_states(id) ON DELETE CASCADE,
  is_popular boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name, state_id)
);

-- Universities/Colleges table
CREATE TABLE public.lookup_universities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  city_id uuid REFERENCES public.lookup_cities(id) ON DELETE SET NULL,
  state_id uuid REFERENCES public.lookup_states(id) ON DELETE SET NULL,
  type text,
  is_popular boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Branches table
CREATE TABLE public.lookup_branches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  short_name text,
  is_popular boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all lookup tables
ALTER TABLE public.lookup_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lookup_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lookup_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lookup_branches ENABLE ROW LEVEL SECURITY;

-- Read-only access for everyone (lookup data is public)
CREATE POLICY "Anyone can read states" ON public.lookup_states FOR SELECT USING (true);
CREATE POLICY "Anyone can read cities" ON public.lookup_cities FOR SELECT USING (true);
CREATE POLICY "Anyone can read universities" ON public.lookup_universities FOR SELECT USING (true);
CREATE POLICY "Anyone can read branches" ON public.lookup_branches FOR SELECT USING (true);

-- Only admins can modify lookup data
CREATE POLICY "Admins can manage states" ON public.lookup_states FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage cities" ON public.lookup_cities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage universities" ON public.lookup_universities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage branches" ON public.lookup_branches FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create standard B-tree indexes for text search (ILIKE compatible)
CREATE INDEX idx_lookup_states_name ON public.lookup_states(lower(name));
CREATE INDEX idx_lookup_cities_name ON public.lookup_cities(lower(name));
CREATE INDEX idx_lookup_universities_name ON public.lookup_universities(lower(name));
CREATE INDEX idx_lookup_branches_name ON public.lookup_branches(lower(name));

-- Indexes for foreign keys and popular items
CREATE INDEX idx_lookup_cities_state_id ON public.lookup_cities(state_id);
CREATE INDEX idx_lookup_cities_popular ON public.lookup_cities(is_popular) WHERE is_popular = true;
CREATE INDEX idx_lookup_universities_city ON public.lookup_universities(city_id);
CREATE INDEX idx_lookup_universities_state ON public.lookup_universities(state_id);
CREATE INDEX idx_lookup_universities_popular ON public.lookup_universities(is_popular) WHERE is_popular = true;

-- Insert initial popular states (India)
INSERT INTO public.lookup_states (name, code, is_popular) VALUES
('Maharashtra', 'MH', true),
('Delhi', 'DL', true),
('Karnataka', 'KA', true),
('Tamil Nadu', 'TN', true),
('Uttar Pradesh', 'UP', true),
('Gujarat', 'GJ', true),
('Telangana', 'TG', true),
('West Bengal', 'WB', true),
('Rajasthan', 'RJ', true),
('Madhya Pradesh', 'MP', true),
('Kerala', 'KL', false),
('Punjab', 'PB', false),
('Haryana', 'HR', false),
('Bihar', 'BR', false),
('Andhra Pradesh', 'AP', false),
('Odisha', 'OD', false),
('Jharkhand', 'JH', false),
('Assam', 'AS', false),
('Chhattisgarh', 'CG', false),
('Uttarakhand', 'UK', false),
('Himachal Pradesh', 'HP', false),
('Goa', 'GA', false),
('Jammu and Kashmir', 'JK', false),
('Chandigarh', 'CH', false),
('Puducherry', 'PY', false);

-- Insert popular branches
INSERT INTO public.lookup_branches (name, short_name, is_popular) VALUES
('Computer Science and Engineering', 'CSE', true),
('Information Technology', 'IT', true),
('Electronics and Communication Engineering', 'ECE', true),
('Electrical Engineering', 'EE', true),
('Mechanical Engineering', 'ME', true),
('Civil Engineering', 'CE', true),
('Chemical Engineering', 'CHE', false),
('Biotechnology', 'BT', false),
('Aerospace Engineering', 'AE', false),
('Data Science', 'DS', true),
('Artificial Intelligence', 'AI', true),
('Machine Learning', 'ML', false),
('Electronics', 'ELEC', false),
('Commerce', 'COM', false),
('Arts', 'ARTS', false),
('Science', 'SCI', false);