import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { CursorPage, CursorPageParam } from "@/hooks/useCursorPagination";

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  flyer_url: string | null;
  category: string;
  event_type: string;
  state: string | null;
  city: string | null;
  is_location_decided: boolean;
  venue_name: string | null;
  venue_address: string | null;
  maps_link: string | null;
  start_date: string;
  end_date: string | null;
  registration_end_date: string | null;
  is_paid: boolean;
  price: number;
  upi_qr_url: string | null;
  upi_vpa: string | null;
  terms_conditions: string | null;
  custom_fields: Json;
  max_capacity: number | null;
  registrations_count: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  views_count: number;
  created_at: string;
  updated_at: string;
  enable_quick_register?: boolean;
  poster_ratio?: '4:5' | '1:1' | '16:9';
  slug?: string;
}

// Check if registration is open for an event
export function isRegistrationOpen(event: Event): boolean {
  // If event is not published, registration is closed
  if (event.status !== 'published') return false;
  
  // If registration_end_date is set, check if current time is before it
  if (event.registration_end_date) {
    return new Date() < new Date(event.registration_end_date);
  }
  
  // If no registration_end_date, registration is open until event starts
  return new Date() < new Date(event.start_date);
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  custom_data: Json;
  payment_screenshot_url: string | null;
  payment_status: 'pending' | 'approved' | 'rejected' | 'used';
  reviewed_at: string | null;
  team_id: string | null;
  created_at: string;
  event?: Event;
}

export interface EventTicket {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  qr_code: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  event?: Event;
  registration?: EventRegistration;
}

export interface EventFilters {
  category?: string;
  is_paid?: boolean;
  search?: string;
  state?: string;
  city?: string;
}

/**
 * Fetch events with cursor-based pagination
 * Uses start_date as cursor for upcoming events ordering
 */
export async function fetchEventsWithCursor(
  params: CursorPageParam,
  filters?: EventFilters
): Promise<CursorPage<Event>> {
  const { cursor, limit } = params;

  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('start_date', { ascending: true })
    .limit(limit + 1);

  // Apply cursor - for ascending order, we want items AFTER the cursor
  if (cursor) {
    query = query.gt('start_date', cursor);
  }

  // Apply filters
  if (filters?.category) {
    query = query.ilike('category', `%${filters.category}%`);
  }
  if (filters?.is_paid !== undefined) {
    query = query.eq('is_paid', filters.is_paid);
  }
  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }
  if (filters?.state) {
    query = query.eq('state', filters.state);
  }
  if (filters?.city) {
    query = query.eq('city', filters.city);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const events = (data || []) as Event[];
  const hasMore = events.length > limit;
  const items = hasMore ? events.slice(0, limit) : events;
  
  const nextCursor = hasMore && items.length > 0
    ? items[items.length - 1].start_date
    : null;

  return {
    data: items,
    nextCursor,
    hasMore,
    totalCount: count ?? undefined,
  };
}

// Legacy function for backward compatibility
export const fetchEvents = async (filters?: EventFilters) => {
  const result = await fetchEventsWithCursor({ cursor: null, limit: 50 }, filters);
  return result.data;
};

// Fetch single event by ID or slug
export const fetchEventByIdOrSlug = async (identifier: string): Promise<Event> => {
  // Check if it looks like a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  const { data, error } = await supabase
    .rpc('get_event_by_id_or_slug', { p_identifier: identifier });

  if (error) throw error;
  
  // RPC returns an array, get the first item
  const event = Array.isArray(data) ? data[0] : data;
  if (!event) throw new Error('Event not found');
  
  return event as Event;
};

// Legacy function for backward compatibility - now uses slug support
export const fetchEventById = async (id: string) => {
  return fetchEventByIdOrSlug(id);
};

// Register for event
export const registerForEvent = async (registration: {
  event_id: string;
  user_id: string;
  custom_data?: Record<string, unknown>;
  payment_screenshot_url?: string;
}) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: registration.event_id,
      user_id: registration.user_id,
      custom_data: registration.custom_data as Json,
      payment_screenshot_url: registration.payment_screenshot_url,
    })
    .select()
    .single();

  if (error) throw error;
  return data as EventRegistration;
};

// Explicit column selection for event registrations
const REGISTRATION_COLUMNS = 'id, event_id, user_id, custom_data, payment_screenshot_url, payment_status, reviewed_at, team_id, created_at, updated_at, is_group_booking, group_size, base_amount, addons_amount, total_amount';

// Check if user is registered for event
export const checkUserRegistration = async (eventId: string, userId: string) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(REGISTRATION_COLUMNS)
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as EventRegistration | null;
};
