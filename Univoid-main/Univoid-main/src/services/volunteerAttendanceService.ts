import { supabase } from "@/integrations/supabase/client";

export interface VolunteerAttendance {
  id: string;
  event_id: string;
  user_id: string;
  invite_id: string | null;
  check_in_at: string;
  check_out_at: string | null;
  total_hours: number | null;
  notes: string | null;
  created_at: string;
}

// Explicit column selection for volunteer attendance
const ATTENDANCE_COLUMNS = 'id, event_id, user_id, invite_id, check_in_at, check_out_at, total_hours, notes, created_at';

export async function checkIn(eventId: string, inviteId?: string): Promise<VolunteerAttendance> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if already checked in without checkout
  const { data: existing } = await supabase
    .from("volunteer_attendance")
    .select(ATTENDANCE_COLUMNS)
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .is("check_out_at", null)
    .maybeSingle();

  if (existing) {
    throw new Error("Already checked in. Please check out first.");
  }

  const { data, error } = await supabase
    .from("volunteer_attendance")
    .insert({
      event_id: eventId,
      user_id: user.id,
      invite_id: inviteId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as VolunteerAttendance;
}

export async function checkOut(attendanceId: string): Promise<VolunteerAttendance> {
  const { data, error } = await supabase
    .from("volunteer_attendance")
    .update({ check_out_at: new Date().toISOString() })
    .eq("id", attendanceId)
    .select()
    .single();

  if (error) throw error;
  return data as VolunteerAttendance;
}

export async function getCurrentAttendance(eventId: string): Promise<VolunteerAttendance | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("volunteer_attendance")
    .select(ATTENDANCE_COLUMNS)
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .is("check_out_at", null)
    .maybeSingle();

  if (error) throw error;
  return data as VolunteerAttendance | null;
}

export async function getMyAttendanceHistory(eventId?: string): Promise<VolunteerAttendance[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("volunteer_attendance")
    .select(ATTENDANCE_COLUMNS)
    .eq("user_id", user.id)
    .order("check_in_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as VolunteerAttendance[];
}

export interface VolunteerAttendanceWithProfile extends VolunteerAttendance {
  profile?: {
    full_name: string | null;
    profile_photo_url: string | null;
  };
}

export async function getEventAttendance(eventId: string): Promise<VolunteerAttendanceWithProfile[]> {
  const { data: attendance, error } = await supabase
    .from("volunteer_attendance")
    .select(ATTENDANCE_COLUMNS)
    .eq("event_id", eventId)
    .order("check_in_at", { ascending: false });

  if (error) throw error;
  if (!attendance || attendance.length === 0) return [];

  // Fetch profiles
  const userIds = [...new Set(attendance.map(a => a.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, profile_photo_url")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return attendance.map(a => ({
    ...a,
    profile: profileMap.get(a.user_id) || undefined,
  })) as VolunteerAttendanceWithProfile[];
}
