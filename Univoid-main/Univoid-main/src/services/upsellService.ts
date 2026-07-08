import { supabase } from "@/integrations/supabase/client";

export interface EventUpsell {
  id: string;
  event_id: string;
  upsell_type: 'group_offer' | 'addon' | 'custom_addon';
  name: string;
  description: string | null;
  price: number;
  discount_amount: number;
  min_quantity: number;
  max_quantity: number;
  group_size: number | null;
  is_active: boolean;
  display_order: number;
  allow_custom_input?: boolean;
  custom_input_label?: string | null;
  custom_input_placeholder?: string | null;
  custom_input_max_length?: number;
}

export interface UpsellSettings {
  id: string;
  event_id: string;
  upsell_enabled: boolean;
  show_group_offers: boolean;
  show_addons: boolean;
}

export interface SelectedUpsell {
  upsell: EventUpsell;
  quantity: number;
  totalPrice: number;
  customInputValue?: string;
}

export interface RegistrationAddon {
  id: string;
  registration_id: string;
  upsell_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  custom_input_value?: string | null;
}

// Fetch upsell settings for an event
export async function fetchUpsellSettings(eventId: string): Promise<UpsellSettings | null> {
  const { data, error } = await supabase
    .from("event_upsell_settings")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching upsell settings:", error);
    return null;
  }

  return data as UpsellSettings | null;
}

// Fetch all active upsells for an event
export async function fetchEventUpsells(eventId: string): Promise<EventUpsell[]> {
  const { data, error } = await supabase
    .from("event_upsells")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching event upsells:", error);
    return [];
  }

  return (data || []) as EventUpsell[];
}

// Save selected addons for a registration
export async function saveRegistrationAddons(
  registrationId: string,
  selectedUpsells: SelectedUpsell[]
): Promise<boolean> {
  if (selectedUpsells.length === 0) return true;

  const addons = selectedUpsells.map(item => ({
    registration_id: registrationId,
    upsell_id: item.upsell.id,
    quantity: item.quantity,
    unit_price: item.upsell.price,
    total_price: item.totalPrice,
    custom_input_value: item.customInputValue || null,
  }));

  const { error } = await supabase
    .from("registration_addons")
    .insert(addons);

  if (error) {
    console.error("Error saving registration addons:", error);
    return false;
  }

  return true;
}

// Fetch addons for a registration
export async function fetchRegistrationAddons(registrationId: string): Promise<RegistrationAddon[]> {
  const { data, error } = await supabase
    .from("registration_addons")
    .select("*")
    .eq("registration_id", registrationId);

  if (error) {
    console.error("Error fetching registration addons:", error);
    return [];
  }

  return (data || []) as RegistrationAddon[];
}

// Calculate total price with upsells
export function calculateTotalWithUpsells(
  basePrice: number,
  groupSize: number,
  selectedUpsells: SelectedUpsell[],
  groupOffers: EventUpsell[]
): { baseTotal: number; discounts: number; addonsTotal: number; finalTotal: number } {
  const baseTotal = basePrice * groupSize;
  
  // Find applicable group offer
  let discounts = 0;
  const applicableOffer = groupOffers
    .filter(o => o.group_size && groupSize >= o.group_size)
    .sort((a, b) => (b.group_size || 0) - (a.group_size || 0))[0];
  
  if (applicableOffer) {
    discounts = applicableOffer.discount_amount;
  }
  
  // Calculate addons total
  const addonsTotal = selectedUpsells.reduce((sum, item) => sum + item.totalPrice, 0);
  
  const finalTotal = Math.max(0, baseTotal - discounts + addonsTotal);
  
  return { baseTotal, discounts, addonsTotal, finalTotal };
}

// Organizer functions
export async function createEventUpsell(
  eventId: string,
  upsell: Partial<EventUpsell>
): Promise<EventUpsell | null> {
  const { data, error } = await supabase
    .from("event_upsells")
    .insert({
      event_id: eventId,
      upsell_type: upsell.upsell_type || 'addon',
      name: upsell.name || '',
      description: upsell.description,
      price: upsell.price || 0,
      discount_amount: upsell.discount_amount || 0,
      min_quantity: upsell.min_quantity || 1,
      max_quantity: upsell.max_quantity || 10,
      group_size: upsell.group_size,
      display_order: upsell.display_order || 0,
      allow_custom_input: upsell.allow_custom_input || false,
      custom_input_label: upsell.custom_input_label,
      custom_input_placeholder: upsell.custom_input_placeholder,
      custom_input_max_length: upsell.custom_input_max_length || 200,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating upsell:", error);
    return null;
  }

  return data as EventUpsell;
}

// Bulk create upsells for a new event
export async function createEventUpsellsBulk(
  eventId: string,
  upsells: Partial<EventUpsell>[]
): Promise<boolean> {
  if (upsells.length === 0) return true;

  const upsellsData = upsells.map((upsell, index) => ({
    event_id: eventId,
    upsell_type: upsell.upsell_type || 'addon',
    name: upsell.name || '',
    description: upsell.description,
    price: upsell.price || 0,
    discount_amount: upsell.discount_amount || 0,
    min_quantity: upsell.min_quantity || 1,
    max_quantity: upsell.max_quantity || 10,
    group_size: upsell.group_size,
    display_order: upsell.display_order ?? index,
    allow_custom_input: upsell.allow_custom_input || false,
    custom_input_label: upsell.custom_input_label,
    custom_input_placeholder: upsell.custom_input_placeholder,
    custom_input_max_length: upsell.custom_input_max_length || 200,
  }));

  const { error } = await supabase
    .from("event_upsells")
    .insert(upsellsData);

  if (error) {
    console.error("Error creating upsells in bulk:", error);
    return false;
  }

  return true;
}

export async function updateEventUpsell(
  upsellId: string,
  updates: Partial<EventUpsell>
): Promise<boolean> {
  const { error } = await supabase
    .from("event_upsells")
    .update(updates)
    .eq("id", upsellId);

  if (error) {
    console.error("Error updating upsell:", error);
    return false;
  }

  return true;
}

export async function deleteEventUpsell(upsellId: string): Promise<boolean> {
  const { error } = await supabase
    .from("event_upsells")
    .delete()
    .eq("id", upsellId);

  if (error) {
    console.error("Error deleting upsell:", error);
    return false;
  }

  return true;
}

export async function updateUpsellSettings(
  eventId: string,
  settings: Partial<UpsellSettings>
): Promise<boolean> {
  const { error } = await supabase
    .from("event_upsell_settings")
    .upsert({
      event_id: eventId,
      upsell_enabled: settings.upsell_enabled ?? false,
      show_group_offers: settings.show_group_offers ?? true,
      show_addons: settings.show_addons ?? true,
    }, { onConflict: 'event_id' });

  if (error) {
    console.error("Error updating upsell settings:", error);
    return false;
  }

  return true;
}
