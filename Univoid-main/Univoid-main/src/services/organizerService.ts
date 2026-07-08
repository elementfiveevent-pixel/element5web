import { supabase } from "@/integrations/supabase/client";

export interface OrganizerProfile {
  id: string;
  user_id: string;
  logo_url: string | null;
  name: string;
  slug: string | null;
  website_url: string | null;
  identity_type: string | null;
  event_types: string[];
  event_frequency: string | null;
  average_event_size: string | null;
  primary_goals: string[];
  discovery_source: string | null;
  is_verified: boolean;
  follower_count: number;
  events_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizerProfileData {
  name: string;
  logo_url?: string | null;
  website_url?: string | null;
  identity_type?: string | null;
  event_types?: string[];
  event_frequency?: string | null;
  average_event_size?: string | null;
  primary_goals?: string[];
  discovery_source?: string | null;
}

export async function hasOrganizerProfile(userId: string): Promise<boolean> {
  // Direct query instead of RPC to avoid type issues
  const { data, error } = await supabase
    .from('organizer_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking organizer profile:', error);
    return false;
  }
  
  return data !== null;
}

export async function getOrganizerProfile(userId: string): Promise<OrganizerProfile | null> {
  const { data, error } = await supabase
    .from('organizer_profiles')
    .select('id, user_id, logo_url, name, slug, website_url, identity_type, event_types, event_frequency, average_event_size, primary_goals, discovery_source, is_verified, follower_count, events_count, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching organizer profile:', error);
    return null;
  }
  
  return data as OrganizerProfile;
}

// Get organizer profile by user_id (same as above, explicit naming)
export async function getOrganizerProfileByUserId(userId: string): Promise<OrganizerProfile | null> {
  return getOrganizerProfile(userId);
}

export async function getOrganizerProfileBySlug(slug: string): Promise<OrganizerProfile | null> {
  const { data, error } = await supabase
    .from('organizer_profiles')
    .select('id, user_id, logo_url, name, slug, website_url, identity_type, event_types, event_frequency, average_event_size, primary_goals, discovery_source, is_verified, follower_count, events_count, created_at, updated_at')
    .eq('slug', slug)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching organizer profile by slug:', error);
    return null;
  }
  
  return data as OrganizerProfile;
}

export async function getOrganizerProfileById(id: string): Promise<OrganizerProfile | null> {
  const { data, error } = await supabase
    .from('organizer_profiles')
    .select('id, user_id, logo_url, name, slug, website_url, identity_type, event_types, event_frequency, average_event_size, primary_goals, discovery_source, is_verified, follower_count, events_count, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching organizer profile by id:', error);
    return null;
  }
  
  return data as OrganizerProfile;
}

export async function createOrganizerProfile(
  userId: string,
  data: CreateOrganizerProfileData
): Promise<{ profile: OrganizerProfile | null; error: Error | null }> {
  // Cast enum types properly for Supabase
  type IdentityType = "individual" | "brand" | "community" | "company" | "nonprofit" | "school" | "university" | "event_company" | "agency" | "others";
  type FrequencyType = "one_time" | "daily" | "weekly" | "monthly" | "seasonal" | "annual";
  type SizeType = "1-50" | "51-100" | "101-500" | "501-1000" | "1000+";
  
  const { data: profile, error } = await supabase
    .from('organizer_profiles')
    .insert({
      user_id: userId,
      name: data.name,
      logo_url: data.logo_url || null,
      website_url: data.website_url || null,
      identity_type: (data.identity_type as IdentityType) || null,
      event_types: data.event_types || [],
      event_frequency: (data.event_frequency as FrequencyType) || null,
      average_event_size: (data.average_event_size as SizeType) || null,
      primary_goals: data.primary_goals || [],
      discovery_source: data.discovery_source || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating organizer profile:', error);
    return { profile: null, error: new Error(error.message) };
  }
  
  // Role is automatically assigned by database trigger
  // Force refresh the session to pick up new role
  try {
    await supabase.auth.refreshSession();
  } catch (refreshError) {
    console.warn('Session refresh after profile creation:', refreshError);
  }
  
  return { profile: profile as OrganizerProfile, error: null };
}

export async function updateOrganizerProfile(
  profileId: string,
  data: Partial<CreateOrganizerProfileData>
): Promise<{ error: Error | null }> {
  // Cast to any to avoid strict enum typing issues
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.logo_url !== undefined) updateData.logo_url = data.logo_url;
  if (data.website_url !== undefined) updateData.website_url = data.website_url;
  if (data.identity_type !== undefined) updateData.identity_type = data.identity_type;
  if (data.event_types !== undefined) updateData.event_types = data.event_types;
  if (data.event_frequency !== undefined) updateData.event_frequency = data.event_frequency;
  if (data.average_event_size !== undefined) updateData.average_event_size = data.average_event_size;
  if (data.primary_goals !== undefined) updateData.primary_goals = data.primary_goals;
  if (data.discovery_source !== undefined) updateData.discovery_source = data.discovery_source;
  
  const { error } = await supabase
    .from('organizer_profiles')
    .update(updateData)
    .eq('id', profileId);
  
  if (error) {
    console.error('Error updating organizer profile:', error);
    return { error: new Error(error.message) };
  }
  
  return { error: null };
}

export async function uploadOrganizerLogo(
  userId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  const fileExt = file.name.split('.').pop();
  // Use folder structure: userId/filename to match RLS policy pattern
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('organizer-logos')
    .upload(fileName, file, { upsert: true });
  
  if (uploadError) {
    console.error('Error uploading logo:', uploadError);
    return { url: null, error: new Error(uploadError.message) };
  }
  
  // Store path only - proxy will generate URLs on-demand (hides Supabase infrastructure)
  const storedPath = `organizer-logos:${fileName}`;
  
  return { url: storedPath, error: null };
}

export async function toggleFollowOrganizer(organizerId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('toggle_organizer_follow', { p_organizer_id: organizerId });
  
  if (error) {
    console.error('Error toggling follow:', error);
    throw error;
  }
  
  return data as boolean;
}

export async function isFollowingOrganizer(organizerId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('organizer_followers')
    .select('id')
    .eq('organizer_id', organizerId)
    .eq('user_id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return false;
    console.error('Error checking follow status:', error);
    return false;
  }
  
  return !!data;
}

export async function getOrganizerEvents(organizerId: string, userId: string) {
  const { data: profile } = await supabase
    .from('organizer_profiles')
    .select('user_id')
    .eq('id', organizerId)
    .maybeSingle();
  
  if (!profile) return { upcoming: [], past: [] };
  
  const now = new Date().toISOString();
  
  const { data: upcoming } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', profile.user_id)
    .eq('status', 'published')
    .gte('end_date', now)
    .order('start_date', { ascending: true })
    .limit(10);
  
  const { data: past } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', profile.user_id)
    .eq('status', 'published')
    .lt('end_date', now)
    .order('end_date', { ascending: false })
    .limit(10);
  
  return { 
    upcoming: upcoming || [], 
    past: past || [] 
  };
}

export async function getAllOrganizers(limit = 50) {
  const { data, error } = await supabase
    .from('organizer_profiles')
    .select('id, user_id, logo_url, name, slug, website_url, identity_type, event_types, event_frequency, average_event_size, primary_goals, discovery_source, is_verified, follower_count, events_count, created_at, updated_at')
    .order('events_count', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching organizers:', error);
    return [];
  }
  
  return data as OrganizerProfile[];
}

export async function setOrganizerVerified(organizerId: string, verified: boolean) {
  const { error } = await supabase
    .from('organizer_profiles')
    .update({ is_verified: verified })
    .eq('id', organizerId);
  
  if (error) {
    console.error('Error setting verification:', error);
    throw error;
  }
}
