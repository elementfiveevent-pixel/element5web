import { supabase } from '@/integrations/supabase/client';

export interface AdminInvite {
  id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  accepted_at: string | null;
  expires_at: string;
  inviter_name?: string;
}

export interface AdminAssistant {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
    profile_photo_url: string | null;
  };
}

// Get all admin invites - using raw query since types aren't generated yet
export async function getAdminInvites(): Promise<AdminInvite[]> {
  const { data, error } = await supabase
    .from('admin_invites' as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Enrich with inviter names
  const invites = (data || []) as unknown as AdminInvite[];
  for (const invite of invites) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', invite.invited_by)
      .single();
    invite.inviter_name = profile?.full_name || 'Unknown';
  }

  return invites;
}

// Send admin assistant invite
export async function sendAdminInvite(email: string): Promise<{ error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase.functions.invoke('send-admin-invite', {
    body: { email, invitedBy: user.id },
  });

  if (error) {
    return { error: error as Error };
  }

  if (data?.error) {
    return { error: new Error(data.error) };
  }

  return { error: null };
}

// Get all admin assistants - using text comparison for new enum value
export async function getAdminAssistants(): Promise<AdminAssistant[]> {
  // Use rpc to check for admin_assistant role since enum might not be in types yet
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Filter for admin_assistant role using string comparison
  const assistantRoles = (data || []).filter((r: any) => r.role === 'admin_assistant');
  
  // Enrich with profile data
  const assistants: AdminAssistant[] = [];
  for (const role of assistantRoles) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, profile_photo_url')
      .eq('id', role.user_id)
      .single();
    
    assistants.push({
      id: role.id,
      user_id: role.user_id,
      role: role.role,
      created_at: role.created_at,
      profile: profile || undefined,
    });
  }

  return assistants;
}

// Remove admin assistant role
export async function removeAdminAssistant(userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', 'admin_assistant' as any);

  return { error: error as Error | null };
}

// Revoke pending invite
export async function revokeAdminInvite(inviteId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('admin_invites' as any)
    .delete()
    .eq('id', inviteId);

  return { error: error as Error | null };
}

// Check if current user is admin (not assistant)
export async function isFullAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  return !!data;
}
