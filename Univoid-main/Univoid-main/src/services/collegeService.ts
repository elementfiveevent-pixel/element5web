import { supabase } from "@/integrations/supabase/client";

export interface College {
  id: string;
  university: string;
  college_name: string;
  college_type: string | null;
  state: string;
  district: string;
  is_popular: boolean;
}

// Fallback Indian states for emergency (if API fails)
const FALLBACK_INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli",
  "Daman & Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// Get all unique states - uses efficient RPC function
export async function getCollegeStates(): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc("get_college_states");
    
    if (error) {
      console.error("Error fetching states:", error);
      return FALLBACK_INDIAN_STATES;
    }
    
    const states = (data || [])
      .map((item: { state: string }) => item.state)
      .filter(Boolean) as string[];
    
    // Return fallback if no states found
    if (states.length === 0) {
      console.warn("No states in database, using fallback");
      return FALLBACK_INDIAN_STATES;
    }
    
    return states;
  } catch (err) {
    console.error("Failed to fetch states:", err);
    return FALLBACK_INDIAN_STATES;
  }
}

// Get districts for a specific state - uses efficient RPC function
export async function getCollegeDistricts(state: string): Promise<string[]> {
  if (!state) return [];
  
  try {
    const { data, error } = await supabase.rpc("get_college_districts", {
      p_state: state,
    });
    
    if (error) {
      console.error("Error fetching districts:", error);
      return [];
    }
    
    return (data || [])
      .map((item: { district: string }) => item.district)
      .filter(Boolean) as string[];
  } catch (err) {
    console.error("Failed to fetch districts:", err);
    return [];
  }
}

// Search colleges with filters
export async function searchColleges(params: {
  state?: string | null;
  district?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}): Promise<College[]> {
  try {
    let query = (supabase as any)
      .from("colleges")
      .select("id, university, college_name, college_type, state, district, is_popular");
    
    if (params.state) {
      query = query.eq("state", params.state);
    }
    
    if (params.district) {
      query = query.eq("district", params.district);
    }
    
    if (params.search && params.search.trim()) {
      query = query.ilike("college_name", `%${params.search}%`);
    }
    
    const { data, error } = await query
      .order("is_popular", { ascending: false })
      .order("college_name")
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 50) - 1);
    
    if (error) {
      console.error("Error searching colleges:", error);
      return [];
    }
    
    return (data || []) as College[];
  } catch (err) {
    console.error("Failed to search colleges:", err);
    return [];
  }
}

// Count colleges with filters
export async function countColleges(params: {
  state?: string | null;
  district?: string | null;
  search?: string | null;
}): Promise<number> {
  try {
    let query = (supabase as any)
      .from("colleges")
      .select("id", { count: "exact", head: true });
    
    if (params.state) {
      query = query.eq("state", params.state);
    }
    
    if (params.district) {
      query = query.eq("district", params.district);
    }
    
    if (params.search && params.search.trim()) {
      query = query.ilike("college_name", `%${params.search}%`);
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error("Error counting colleges:", error);
      return 0;
    }
    
    return count || 0;
  } catch (err) {
    console.error("Failed to count colleges:", err);
    return 0;
  }
}
