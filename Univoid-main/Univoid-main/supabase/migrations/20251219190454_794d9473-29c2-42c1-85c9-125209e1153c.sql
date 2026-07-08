-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  skills_required TEXT[] DEFAULT '{}',
  linked_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  is_open BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_members table (for approved team members)
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create project_tasks table
CREATE TABLE public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
  assigned_to UUID,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_requests table (join requests)
CREATE TABLE public.project_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_id)
);

-- Create tasks (Task Plaza - anonymous help requests)
CREATE TABLE public.task_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('handwritten_manual', 'typing_assignment', 'ppt_creation', 'diagram_drawing', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  page_count INTEGER,
  deadline TIMESTAMP WITH TIME ZONE,
  budget NUMERIC,
  is_negotiable BOOLEAN DEFAULT false,
  attachment_urls TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('open', 'assigned', 'completed', 'cancelled')) DEFAULT 'open',
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_bids table (solvers bidding on tasks)
CREATE TABLE public.task_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.task_requests(id) ON DELETE CASCADE,
  solver_id UUID NOT NULL,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, solver_id)
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Anyone can view open projects" ON public.projects
  FOR SELECT USING (is_open = true OR owner_id = auth.uid());

CREATE POLICY "Authenticated users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their projects" ON public.projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their projects" ON public.projects
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for project_members
CREATE POLICY "Anyone can view project members" ON public.project_members
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage members" ON public.project_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_members.project_id AND owner_id = auth.uid())
  );

-- RLS Policies for project_tasks
CREATE POLICY "Project members can view tasks" ON public.project_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_tasks.project_id 
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Project owners can manage tasks" ON public.project_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_tasks.project_id AND owner_id = auth.uid())
  );

CREATE POLICY "Members can update assigned tasks" ON public.project_tasks
  FOR UPDATE USING (auth.uid() = assigned_to);

-- RLS Policies for project_requests
CREATE POLICY "Users can view own requests" ON public.project_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Project owners can view requests" ON public.project_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_requests.project_id AND owner_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create requests" ON public.project_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners can update requests" ON public.project_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_requests.project_id AND owner_id = auth.uid())
  );

-- RLS Policies for task_requests
CREATE POLICY "Anyone can view open tasks" ON public.task_requests
  FOR SELECT USING (status = 'open' OR requester_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Authenticated users can create tasks" ON public.task_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update own tasks" ON public.task_requests
  FOR UPDATE USING (auth.uid() = requester_id);

CREATE POLICY "Requesters can delete own tasks" ON public.task_requests
  FOR DELETE USING (auth.uid() = requester_id);

-- RLS Policies for task_bids
CREATE POLICY "Task owners can view bids" ON public.task_bids
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.task_requests WHERE id = task_bids.task_id AND requester_id = auth.uid())
    OR solver_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create bids" ON public.task_bids
  FOR INSERT WITH CHECK (auth.uid() = solver_id);

CREATE POLICY "Task owners can update bids" ON public.task_bids
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.task_requests WHERE id = task_bids.task_id AND requester_id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_requests_updated_at
  BEFORE UPDATE ON public.task_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();