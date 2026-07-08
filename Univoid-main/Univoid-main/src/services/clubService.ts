import { supabase } from "@/integrations/supabase/client";

export interface Club {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventClub {
  id: string;
  event_id: string;
  club_id: string;
  member_price: number;
  member_benefits: string | null;
  created_at: string;
  club?: Club;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  membership_id: string | null;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
}

// Fetch all clubs
export async function fetchClubs(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Create a new club
export async function createClub(club: {
  name: string;
  short_name?: string;
  logo_url?: string;
  description?: string;
}): Promise<Club> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('clubs')
    .insert({
      name: club.name,
      short_name: club.short_name || null,
      logo_url: club.logo_url || null,
      description: club.description || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fetch clubs associated with an event
export async function fetchEventClubs(eventId: string): Promise<EventClub[]> {
  const { data, error } = await supabase
    .from('event_clubs')
    .select(`
      *,
      club:clubs(*)
    `)
    .eq('event_id', eventId);

  if (error) throw error;
  
  return (data || []).map(item => ({
    ...item,
    club: item.club as Club,
  }));
}

// Add club to event
export async function addClubToEvent(
  eventId: string,
  clubId: string,
  memberPrice: number,
  memberBenefits?: string
): Promise<EventClub> {
  const { data, error } = await supabase
    .from('event_clubs')
    .insert({
      event_id: eventId,
      club_id: clubId,
      member_price: memberPrice,
      member_benefits: memberBenefits || null,
    })
    .select(`
      *,
      club:clubs(*)
    `)
    .single();

  if (error) throw error;
  return {
    ...data,
    club: data.club as Club,
  };
}

// Remove club from event
export async function removeClubFromEvent(eventClubId: string): Promise<void> {
  const { error } = await supabase
    .from('event_clubs')
    .delete()
    .eq('id', eventClubId);

  if (error) throw error;
}

// Update event club pricing
export async function updateEventClub(
  eventClubId: string,
  updates: { member_price?: number; member_benefits?: string }
): Promise<void> {
  const { error } = await supabase
    .from('event_clubs')
    .update(updates)
    .eq('id', eventClubId);

  if (error) throw error;
}

// Claim club membership
export async function claimClubMembership(
  clubId: string,
  membershipId?: string
): Promise<ClubMember> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('club_members')
    .insert({
      club_id: clubId,
      user_id: user.id,
      membership_id: membershipId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Check if user is a member of any clubs for an event
export async function checkEventClubMembership(
  eventId: string,
  userId: string
): Promise<{ clubId: string; memberPrice: number; club: Club }[]> {
  // Get clubs associated with this event
  const { data: eventClubs, error: ecError } = await supabase
    .from('event_clubs')
    .select(`
      club_id,
      member_price,
      club:clubs(*)
    `)
    .eq('event_id', eventId);

  if (ecError) throw ecError;
  if (!eventClubs || eventClubs.length === 0) return [];

  // Check user's memberships
  const clubIds = eventClubs.map(ec => ec.club_id);
  const { data: memberships, error: mError } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId)
    .in('club_id', clubIds);

  if (mError) throw mError;

  // Return clubs where user is a member
  const memberClubIds = new Set(memberships?.map(m => m.club_id) || []);
  
  return eventClubs
    .filter(ec => memberClubIds.has(ec.club_id))
    .map(ec => ({
      clubId: ec.club_id,
      memberPrice: ec.member_price,
      club: ec.club as unknown as Club,
    }));
}

// Get user's membership for a specific club
export async function getUserClubMembership(
  clubId: string,
  userId: string
): Promise<ClubMember | null> {
  const { data, error } = await supabase
    .from('club_members')
    .select('*')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
