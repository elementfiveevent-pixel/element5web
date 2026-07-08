import { supabase } from "@/integrations/supabase/client";

export interface TicketCategory {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  max_per_user: number;
  max_total: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DraftTicketCategory {
  name: string;
  description: string;
  price: number;
  max_per_user: number;
  max_total: number | null;
}

export interface TicketCategorySelection {
  category: TicketCategory;
  quantity: number;
  attendees: AttendeeInfo[];
  audienceCount: number;
}

export interface AttendeeInfo {
  name: string;
  email: string;
  mobile: string;
}

// Fetch ticket categories for an event
export async function fetchTicketCategories(eventId: string): Promise<TicketCategory[]> {
  const { data, error } = await supabase
    .from("ticket_categories")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data || []) as TicketCategory[];
}

// Create ticket categories in bulk (during event creation)
export async function createTicketCategories(
  eventId: string,
  categories: DraftTicketCategory[]
): Promise<TicketCategory[]> {
  const toInsert = categories.map((cat, index) => ({
    event_id: eventId,
    name: cat.name,
    description: cat.description || null,
    price: cat.price,
    max_per_user: cat.max_per_user,
    max_total: cat.max_total,
    display_order: index,
    is_active: true,
  }));

  const { data, error } = await supabase
    .from("ticket_categories")
    .insert(toInsert)
    .select();

  if (error) throw error;
  return (data || []) as TicketCategory[];
}

// Update a ticket category
export async function updateTicketCategory(
  id: string,
  updates: Partial<DraftTicketCategory>
): Promise<void> {
  const { error } = await supabase
    .from("ticket_categories")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

// Delete (deactivate) a ticket category
export async function deactivateTicketCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from("ticket_categories")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw error;
}

// Save attendees for a registration
export async function saveTicketAttendees(
  registrationId: string,
  attendees: { ticket_category_id: string; attendee_name: string; attendee_email: string; attendee_mobile: string }[]
): Promise<void> {
  const toInsert = attendees.map(a => ({
    registration_id: registrationId,
    ticket_category_id: a.ticket_category_id,
    attendee_name: a.attendee_name,
    attendee_email: a.attendee_email,
    attendee_mobile: a.attendee_mobile,
  }));

  const { error } = await supabase
    .from("ticket_attendees")
    .insert(toInsert);

  if (error) throw error;
}

// Fetch attendees for a registration (organizer view)
export async function fetchRegistrationAttendees(registrationId: string) {
  const { data, error } = await supabase
    .from("ticket_attendees")
    .select("*, ticket_categories(name, price)")
    .eq("registration_id", registrationId);

  if (error) throw error;
  return data || [];
}
