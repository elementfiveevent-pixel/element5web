import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface SecureCheckInResult {
  success: boolean;
  error?: string;
  message?: string;
  attendee_name?: string;
  ticket_id?: string;
  avatar_url?: string;
  used_at?: string;
  used_by?: string;
}

export interface TicketWithDetails {
  id: string;
  qr_code: string;
  is_used: boolean;
  used_at: string | null;
  verification_method: string | null;
  abuse_flag: boolean;
  scan_attempts: number;
  created_at: string;
  event: {
    id: string;
    title: string;
    start_date: string;
    end_date: string | null;
    venue_name: string | null;
    venue_address: string | null;
    flyer_url: string | null;
    status: string;
  };
  registration: {
    payment_status: string;
  };
}

// Generate device fingerprint from browser
export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// Secure check-in using database function with atomic locking
export const secureCheckIn = async (
  qrCode: string,
  eventId: string,
  organizerId: string,
  verificationMethod: 'qr' | 'manual' = 'qr'
): Promise<SecureCheckInResult> => {
  const deviceFingerprint = generateDeviceFingerprint();
  
  const { data, error } = await supabase.rpc('secure_check_in', {
    p_qr_code: qrCode,
    p_event_id: eventId,
    p_organizer_id: organizerId,
    p_verification_method: verificationMethod,
    p_device_fingerprint: deviceFingerprint
  });

  if (error) {
    console.error('Secure check-in error:', error);
    return {
      success: false,
      error: 'DATABASE_ERROR',
      message: error.message
    };
  }

  return data as unknown as SecureCheckInResult;
};

// Fetch user's tickets with full details
export const fetchUserTickets = async (userId: string): Promise<TicketWithDetails[]> => {
  const { data, error } = await supabase
    .from("event_tickets")
    .select(`
      id, qr_code, is_used, used_at, verification_method, abuse_flag, scan_attempts, created_at,
      event:events(id, title, start_date, end_date, venue_name, venue_address, flyer_url, status),
      registration:event_registrations(payment_status)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as TicketWithDetails[];
};

// Create secure ticket using database function
export const createSecureTicket = async (
  registrationId: string,
  eventId: string,
  userId: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('create_secure_ticket', {
    p_registration_id: registrationId,
    p_event_id: eventId,
    p_user_id: userId
  });

  if (error) {
    console.error('Create ticket error:', error);
    throw error;
  }

  return data as string;
};

// Fetch check-in stats for an event
export const fetchCheckInStats = async (eventId: string) => {
  const { data, error } = await supabase
    .from("event_tickets")
    .select("is_used, used_at, abuse_flag")
    .eq("event_id", eventId);

  if (error) throw error;

  const total = data?.length || 0;
  const checkedIn = data?.filter(t => t.is_used).length || 0;
  const abuseFlags = data?.filter(t => t.abuse_flag).length || 0;

  return {
    total,
    checkedIn,
    remaining: total - checkedIn,
    percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    abuseFlags
  };
};

// Fetch recent check-ins with attendee info
export const fetchRecentCheckIns = async (eventId: string, limit: number = 10) => {
  const { data: tickets, error } = await supabase
    .from("event_tickets")
    .select(`
      id,
      is_used,
      used_at,
      user_id,
      verification_method,
      abuse_flag
    `)
    .eq("event_id", eventId)
    .eq("is_used", true)
    .order("used_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Fetch user profiles
  const userIds = tickets?.map(t => t.user_id) || [];
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, profile_photo_url")
    .in("id", userIds);

  return tickets?.map(ticket => ({
    ...ticket,
    profile: profiles?.find(p => p.id === ticket.user_id),
  })) || [];
};

// Fetch audit log for an event
export const fetchCheckInAuditLog = async (eventId: string, limit: number = 50) => {
  const { data, error } = await supabase
    .from("check_in_audit_log")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Manual ticket lookup by ID (for manual verification)
export const lookupTicketById = async (ticketId: string, eventId: string) => {
  const { data, error } = await supabase
    .from("event_tickets")
    .select(`
      id, qr_code, is_used, used_at, user_id, abuse_flag, scan_attempts,
      registration:event_registrations(payment_status, custom_data)
    `)
    .eq("id", ticketId)
    .eq("event_id", eventId)
    .single();

  if (error) return null;

  // Get attendee name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, profile_photo_url")
    .eq("id", data.user_id)
    .single();

  return {
    ...data,
    attendee: profile
  };
};
