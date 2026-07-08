-- =============================================
-- PERFORMANCE INDEXES FOR SCALABILITY
-- =============================================

-- Materials table - most frequently queried
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_materials_status_created ON materials(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_created_by ON materials(created_by);
CREATE INDEX IF NOT EXISTS idx_materials_course_branch ON materials(course, branch);
CREATE INDEX IF NOT EXISTS idx_materials_subject ON materials(subject);

-- Books table
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_status_created ON books(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_created_by ON books(created_by);
CREATE INDEX IF NOT EXISTS idx_books_is_sold ON books(is_sold);

-- Events table
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_status_start ON events(status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- News table
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_status_created ON news(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);

-- Event registrations - for organizer dashboard
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment ON event_registrations(payment_status);

-- Event tickets - for check-in
CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_qr ON event_tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_event_tickets_user ON event_tickets(user_id);

-- Profiles - for leaderboard and lookups
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_disabled ON profiles(is_disabled);

-- User roles - frequently checked
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Projects table
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_open ON projects(is_open);

-- Task requests
CREATE INDEX IF NOT EXISTS idx_task_requests_status ON task_requests(status);
CREATE INDEX IF NOT EXISTS idx_task_requests_requester ON task_requests(requester_id);

-- Material likes - for engagement
CREATE INDEX IF NOT EXISTS idx_material_likes_material ON material_likes(material_id);
CREATE INDEX IF NOT EXISTS idx_material_likes_user ON material_likes(user_id);