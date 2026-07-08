import { supabase } from "@/integrations/supabase/client";

export type VolunteerInviteRole = 'entry' | 'qr_checkin' | 'help_desk' | 'all';
export type VolunteerInviteStatus = 'pending' | 'accepted' | 'rejected';

export interface VolunteerInvite {
  id: string;
  event_id: string;
  user_id: string;
  invited_by: string;
  role: VolunteerInviteRole;
  status: VolunteerInviteStatus;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  // Joined data
  user_profile?: {
    full_name: string;
    email: string;
    profile_photo_url: string | null;
  };
  event?: {
    title: string;
    start_date: string;
    end_date: string | null;
  };
  inviter_profile?: {
    full_name: string;
  };
}

export const ROLE_LABELS: Record<VolunteerInviteRole, string> = {
  entry: 'Entry Management',
  qr_checkin: 'QR Check-in',
  help_desk: 'Help Desk',
  all: 'All Roles',
};

export const STATUS_LABELS: Record<VolunteerInviteStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

/**
 * Find a user by email (must be registered on UniVoid)
 * Uses the database function that checks both profiles and auth.users tables
 */
export async function findUserByEmail(email: string): Promise<{ id: string; full_name: string; email: string } | null> {
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    console.warn('[Volunteer Invite] Invalid email format:', email);
    return null;
  }

  console.log('[Volunteer Invite] Searching for user with email:', normalizedEmail);

  // Use the database function that has access to auth.users
  const { data, error } = await supabase
    .rpc('find_user_by_email', { search_email: normalizedEmail });

  if (error) {
    console.error('[Volunteer Invite] Error finding user by email:', error);
    throw new Error('Failed to search for user');
  }

  // The function returns an array, get the first result
  if (data && data.length > 0) {
    const user = data[0];
    console.log('[Volunteer Invite] Found user:', { id: user.user_id, name: user.user_full_name });
    return {
      id: user.user_id,
      full_name: user.user_full_name || normalizedEmail.split('@')[0],
      email: user.user_email
    };
  }

  console.log('[Volunteer Invite] No user found with email:', normalizedEmail);
  return null;
}

/**
 * Check if an invite already exists for this user and event
 */
export async function checkExistingInvite(eventId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('event_volunteer_invites')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking existing invite:', error);
    throw new Error('Failed to check for existing invite');
  }

  return !!data;
}

/**
 * Create a new volunteer invite
 */
export async function createVolunteerInvite(
  eventId: string,
  userId: string,
  invitedBy: string,
  role: VolunteerInviteRole
): Promise<VolunteerInvite> {
  const { data, error } = await supabase
    .from('event_volunteer_invites')
    .insert({
      event_id: eventId,
      user_id: userId,
      invited_by: invitedBy,
      role: role,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating volunteer invite:', error);
    if (error.code === '23505') {
      throw new Error('User has already been invited to this event');
    }
    throw new Error('Failed to create invite');
  }

  return data as VolunteerInvite;
}

/**
 * Send in-app notification to invited volunteer
 */
export async function sendVolunteerInviteNotification(
  userId: string,
  eventId: string,
  eventTitle: string,
  organizerName: string,
  role: VolunteerInviteRole
): Promise<void> {
  // Send in-app notification - direct link to volunteer invites section
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'Volunteer Invitation',
      message: `You've been invited to volunteer for "${eventTitle}" as ${ROLE_LABELS[role]}. Invited by: ${organizerName}`,
      type: 'volunteer_invite',
      link: '/dashboard?tab=volunteer',
    });

  if (error) {
    console.error('[Volunteer Invite] Error creating notification:', error);
  } else {
    console.log('[Volunteer Invite] Notification created for user:', userId);
  }

  // Send email notification (fire and forget)
  try {
    await supabase.functions.invoke('send-volunteer-notification', {
      body: {
        type: 'invite',
        userId,
        eventId,
        eventTitle,
        organizerName,
        role,
      },
    });
  } catch (emailError) {
    console.error('Error sending email notification:', emailError);
    // Don't throw - email failure shouldn't block the invite
  }
}

/**
 * Get all invites for an event (organizer view)
 */
export async function getEventVolunteerInvites(eventId: string): Promise<VolunteerInvite[]> {
  const { data: invites, error } = await supabase
    .from('event_volunteer_invites')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching volunteer invites:', error);
    throw new Error('Failed to fetch volunteer invites');
  }

  if (!invites || invites.length === 0) return [];

  // Fetch user profiles
  const userIds = invites.map(i => i.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, profile_photo_url')
    .in('id', userIds);

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
  }

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return invites.map(invite => ({
    ...invite,
    user_profile: profileMap.get(invite.user_id) || undefined,
  })) as VolunteerInvite[];
}

/**
 * Get all pending invites for a user
 */
export async function getUserVolunteerInvites(userId: string): Promise<VolunteerInvite[]> {
  const { data: invites, error } = await supabase
    .from('event_volunteer_invites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user invites:', error);
    throw new Error('Failed to fetch your invites');
  }

  if (!invites || invites.length === 0) return [];

  // Fetch event details
  const eventIds = invites.map(i => i.event_id);
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, title, start_date, end_date, organizer_id')
    .in('id', eventIds);

  if (eventError) {
    console.error('Error fetching events:', eventError);
  }

  // Fetch inviter profiles
  const inviterIds = [...new Set(invites.map(i => i.invited_by))];
  const { data: inviters, error: inviterError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', inviterIds);

  if (inviterError) {
    console.error('Error fetching inviter profiles:', inviterError);
  }

  const eventMap = new Map(events?.map(e => [e.id, e]) || []);
  const inviterMap = new Map(inviters?.map(i => [i.id, i]) || []);

  return invites.map(invite => ({
    ...invite,
    event: eventMap.get(invite.event_id) || undefined,
    inviter_profile: inviterMap.get(invite.invited_by) || undefined,
  })) as VolunteerInvite[];
}

/**
 * Accept a volunteer invite
 */
export async function acceptVolunteerInvite(inviteId: string): Promise<void> {
  // First get invite details for notification
  const { data: invite, error: fetchError } = await supabase
    .from('event_volunteer_invites')
    .select('*, events(title, organizer_id)')
    .eq('id', inviteId)
    .single();

  if (fetchError) {
    console.error('Error fetching invite:', fetchError);
    throw new Error('Failed to fetch invite details');
  }

  // Update the invite status
  const { error } = await supabase
    .from('event_volunteer_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', inviteId);

  if (error) {
    console.error('Error accepting invite:', error);
    throw new Error('Failed to accept invite');
  }

  // Get volunteer name for notification
  const { data: { user } } = await supabase.auth.getUser();
  const { data: volunteerProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single();

  // Send email notification to organizer (fire and forget)
  if (invite?.events) {
    const eventData = invite.events as { title: string; organizer_id: string };
    try {
      await supabase.functions.invoke('send-volunteer-notification', {
        body: {
          type: 'invite_accepted',
          organizerId: eventData.organizer_id,
          eventTitle: eventData.title,
          eventId: invite.event_id,
          volunteerName: volunteerProfile?.full_name || 'A volunteer',
          volunteerRole: invite.role,
        },
      });
    } catch (emailError) {
      console.error('Error sending organizer notification:', emailError);
    }
  }
}

/**
 * Reject a volunteer invite
 */
export async function rejectVolunteerInvite(inviteId: string): Promise<void> {
  // First get invite details for notification
  const { data: invite, error: fetchError } = await supabase
    .from('event_volunteer_invites')
    .select('*, events(title, organizer_id)')
    .eq('id', inviteId)
    .single();

  if (fetchError) {
    console.error('Error fetching invite:', fetchError);
    throw new Error('Failed to fetch invite details');
  }

  // Update the invite status
  const { error } = await supabase
    .from('event_volunteer_invites')
    .update({ status: 'rejected' })
    .eq('id', inviteId);

  if (error) {
    console.error('Error rejecting invite:', error);
    throw new Error('Failed to reject invite');
  }

  // Get volunteer name for notification
  const { data: { user } } = await supabase.auth.getUser();
  const { data: volunteerProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single();

  // Send email notification to organizer (fire and forget)
  if (invite?.events) {
    const eventData = invite.events as { title: string; organizer_id: string };
    try {
      await supabase.functions.invoke('send-volunteer-notification', {
        body: {
          type: 'invite_rejected',
          organizerId: eventData.organizer_id,
          eventTitle: eventData.title,
          eventId: invite.event_id,
          volunteerName: volunteerProfile?.full_name || 'A volunteer',
          volunteerRole: invite.role,
        },
      });
    } catch (emailError) {
      console.error('Error sending organizer notification:', emailError);
    }
  }
}

/**
 * Delete a volunteer invite (organizer only)
 */
export async function deleteVolunteerInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('event_volunteer_invites')
    .delete()
    .eq('id', inviteId);

  if (error) {
    console.error('Error deleting invite:', error);
    throw new Error('Failed to delete invite');
  }
}

/**
 * Check if user is an accepted volunteer for an event
 */
export async function isAcceptedVolunteer(eventId: string, userId: string): Promise<{ isVolunteer: boolean; role?: VolunteerInviteRole }> {
  const { data, error } = await supabase
    .from('event_volunteer_invites')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .maybeSingle();

  if (error) {
    console.error('Error checking volunteer status:', error);
    return { isVolunteer: false };
  }

  return {
    isVolunteer: !!data,
    role: data?.role as VolunteerInviteRole | undefined,
  };
}

/**
 * Get all events where user is an accepted volunteer
 */
export async function getVolunteerEvents(userId: string): Promise<{ id: string; event_id: string; role: VolunteerInviteRole; event: { id: string; title: string; start_date: string; end_date: string | null; status: string } }[]> {
  console.log('[Volunteer Events] Fetching for user:', userId);
  
  const { data: invites, error } = await supabase
    .from('event_volunteer_invites')
    .select('id, event_id, role')
    .eq('user_id', userId)
    .eq('status', 'accepted');

  if (error) {
    console.error('[Volunteer Events] Error fetching invites:', error);
    return [];
  }

  console.log('[Volunteer Events] Found accepted invites:', invites?.length || 0, invites);

  if (!invites || invites.length === 0) return [];

  const eventIds = invites.map(i => i.event_id);
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, title, start_date, end_date, status')
    .in('id', eventIds)
    .in('status', ['published', 'completed']);

  if (eventError) {
    console.error('[Volunteer Events] Error fetching events:', eventError);
    return [];
  }

  console.log('[Volunteer Events] Found events:', events?.length || 0, events);

  const eventMap = new Map(events?.map(e => [e.id, e]) || []);

  const result = invites
    .filter(i => eventMap.has(i.event_id))
    .map(i => ({
      id: i.id,
      event_id: i.event_id,
      role: i.role as VolunteerInviteRole,
      event: eventMap.get(i.event_id)!,
    }));
  
  console.log('[Volunteer Events] Returning:', result.length, 'events');
  return result;
}
