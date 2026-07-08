import { supabase } from '@/integrations/supabase/client';
import { sendPartnerRequestEmail } from './brevoEmailService';

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  skills_required: string[];
  linked_event_id: string | null;
  is_open: boolean;
  max_members: number;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  member_count?: number;
  event_title?: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_name?: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  assigned_to: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
}

export interface ProjectRequest {
  id: string;
  project_id: string;
  user_id: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  user_name?: string;
}

// Explicit column selection for projects
const PROJECT_COLUMNS = 'id, owner_id, title, description, skills_required, linked_event_id, is_open, max_members, created_at, updated_at';
const PROJECT_MEMBER_COLUMNS = 'id, project_id, user_id, role, joined_at';
const PROJECT_TASK_COLUMNS = 'id, project_id, title, description, status, assigned_to, deadline, created_at, updated_at';
const PROJECT_REQUEST_COLUMNS = 'id, project_id, user_id, message, status, created_at, reviewed_at';

// Get all open projects
export async function getProjects(eventId?: string): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('is_open', true)
    .order('created_at', { ascending: false });

  if (eventId) {
    query = query.eq('linked_event_id', eventId);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Enrich with owner names and member counts
  const projects = data || [];
  for (const project of projects) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: project.owner_id,
    });
    (project as any).owner_name = nameData || 'Anonymous';

    const { count } = await supabase
      .from('project_members')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id);
    (project as any).member_count = (count || 0) + 1; // +1 for owner
  }

  return projects as Project[];
}

// Get project by ID
export async function getProjectById(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('id', projectId)
    .single();

  if (error) return null;

  const { data: nameData } = await supabase.rpc('get_contributor_name', {
    user_id: data.owner_id,
  });
  (data as any).owner_name = nameData || 'Anonymous';

  const { count } = await supabase
    .from('project_members')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);
  (data as any).member_count = (count || 0) + 1;

  return data as Project;
}

// Create a project
export async function createProject(project: {
  title: string;
  description?: string;
  skills_required?: string[];
  linked_event_id?: string;
  max_members?: number;
}): Promise<{ data: Project | null; error: Error | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...project,
      owner_id: userData.user.id,
    })
    .select()
    .single();

  return { data: data as Project, error: error as Error | null };
}

// Update project
export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId);

  return { error: error as Error | null };
}

// Delete project
export async function deleteProject(projectId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  return { error: error as Error | null };
}

// Get project members
export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select(PROJECT_MEMBER_COLUMNS)
    .eq('project_id', projectId);

  if (error) return [];

  for (const member of data || []) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: member.user_id,
    });
    (member as any).user_name = nameData || 'Anonymous';
  }

  return data as ProjectMember[];
}

// Get project tasks
export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const { data, error } = await supabase
    .from('project_tasks')
    .select(PROJECT_TASK_COLUMNS)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) return [];

  for (const task of data || []) {
    if (task.assigned_to) {
      const { data: nameData } = await supabase.rpc('get_contributor_name', {
        user_id: task.assigned_to,
      });
      (task as any).assignee_name = nameData || 'Unassigned';
    }
  }

  return data as ProjectTask[];
}

// Create task
export async function createProjectTask(task: {
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  deadline?: string;
}): Promise<{ data: ProjectTask | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('project_tasks')
    .insert(task)
    .select()
    .single();

  return { data: data as ProjectTask, error: error as Error | null };
}

// Update task
export async function updateProjectTask(
  taskId: string,
  updates: Partial<ProjectTask>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('project_tasks')
    .update(updates)
    .eq('id', taskId);

  return { error: error as Error | null };
}

// Delete task
export async function deleteProjectTask(taskId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', taskId);

  return { error: error as Error | null };
}

// Get project requests
export async function getProjectRequests(projectId: string): Promise<ProjectRequest[]> {
  const { data, error } = await supabase
    .from('project_requests')
    .select(PROJECT_REQUEST_COLUMNS)
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) return [];

  for (const request of data || []) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: request.user_id,
    });
    (request as any).user_name = nameData || 'Anonymous';
  }

  return data as ProjectRequest[];
}

// Request to join project
export async function requestToJoinProject(
  projectId: string,
  message?: string
): Promise<{ error: Error | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('project_requests')
    .insert({
      project_id: projectId,
      user_id: userData.user.id,
      message,
    });

  if (!error) {
    // Send email notification to project owner (fire and forget)
    try {
      // Get project details and owner info
      const { data: projectData } = await supabase
        .from('projects')
        .select('title, owner_id')
        .eq('id', projectId)
        .single();
      
      if (projectData) {
        // Get owner email
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', projectData.owner_id)
          .single();
        
        // Get sender info
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', userData.user.id)
          .single();
        
        if (ownerProfile && senderProfile) {
          sendPartnerRequestEmail(
            ownerProfile.email,
            ownerProfile.full_name,
            senderProfile.full_name,
            senderProfile.email,
            projectData.title,
            message || undefined
          );
        }
      }
    } catch (emailError) {
      console.error('[ProjectsService] Failed to send partner request email:', emailError);
    }
  }

  return { error: error as Error | null };
}

// Approve request
export async function approveProjectRequest(
  requestId: string,
  projectId: string,
  userId: string
): Promise<{ error: Error | null }> {
  // Update request status
  const { error: updateError } = await supabase
    .from('project_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  if (updateError) return { error: updateError as Error };

  // Add member
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId });

  return { error: memberError as Error | null };
}

// Reject request
export async function rejectProjectRequest(requestId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('project_requests')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  return { error: error as Error | null };
}

// Check if user has pending request
export async function hasExistingRequest(projectId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data } = await supabase
    .from('project_requests')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  return !!data;
}

// Check if user is a member
export async function isProjectMember(projectId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  // Check if owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single();

  if (project?.owner_id === userData.user.id) return true;

  // Check if member
  const { data } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  return !!data;
}

// Get user's projects (owned or member of)
export async function getMyProjects(): Promise<Project[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  // Get owned projects
  const { data: owned } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('owner_id', userData.user.id)
    .order('created_at', { ascending: false });

  // Get member projects
  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userData.user.id);

  const memberProjectIds = memberships?.map(m => m.project_id) || [];
  
  let memberProjects: any[] = [];
  if (memberProjectIds.length > 0) {
    const { data } = await supabase
      .from('projects')
      .select(PROJECT_COLUMNS)
      .in('id', memberProjectIds);
    memberProjects = data || [];
  }

  const allProjects = [...(owned || []), ...memberProjects];
  
  // Enrich with owner names
  for (const project of allProjects) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: project.owner_id,
    });
    (project as any).owner_name = nameData || 'Anonymous';
  }

  return allProjects as Project[];
}
