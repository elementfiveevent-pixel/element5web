-- Performance indexes for frequently queried columns
-- These indexes will significantly improve query performance at scale

-- Materials table indexes
CREATE INDEX IF NOT EXISTS idx_materials_status ON public.materials(status);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON public.materials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_created_by ON public.materials(created_by);
CREATE INDEX IF NOT EXISTS idx_materials_status_created_at ON public.materials(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_branch ON public.materials(branch) WHERE branch IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materials_course ON public.materials(course) WHERE course IS NOT NULL;

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status_start_date ON public.events(status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);

-- Scholarships table indexes
CREATE INDEX IF NOT EXISTS idx_scholarships_status ON public.scholarships(status);
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON public.scholarships(deadline);
CREATE INDEX IF NOT EXISTS idx_scholarships_status_deadline ON public.scholarships(status, deadline);
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline_status ON public.scholarships(deadline_status);

-- Books table indexes
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_created_by ON public.books(created_by);
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_is_sold ON public.books(is_sold);

-- Profiles table indexes (for leaderboard and lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON public.profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_college_name ON public.profiles(college_name) WHERE college_name IS NOT NULL;

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);

-- Event registrations indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status ON public.event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_status ON public.event_registrations(event_id, payment_status);

-- Event tickets indexes
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON public.event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_user_id ON public.event_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_qr_code ON public.event_tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_event_tickets_registration_id ON public.event_tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_is_used ON public.event_tickets(is_used);

-- News table indexes
CREATE INDEX IF NOT EXISTS idx_news_status ON public.news(status);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_open ON public.projects(is_open);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- Task requests indexes
CREATE INDEX IF NOT EXISTS idx_task_requests_status ON public.task_requests(status);
CREATE INDEX IF NOT EXISTS idx_task_requests_requester_id ON public.task_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_task_requests_created_at ON public.task_requests(created_at DESC);

-- User roles index (frequently checked for permissions)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);