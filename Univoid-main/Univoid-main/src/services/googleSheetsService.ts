import { supabase } from "@/integrations/supabase/client";

export interface SheetSyncConfig {
  id?: string;
  event_id: string;
  spreadsheet_id: string;
  sheet_name: string;
  auto_sync: boolean;
  last_sync_at?: string;
}

// Get service account info
export async function getServiceAccountInfo(): Promise<{ serviceAccountEmail?: string; configured: boolean }> {
  const { data, error } = await supabase.functions.invoke("sync-to-sheets", {
    body: { action: "get-info" },
  });

  if (error) {
    console.error("Failed to get service account info:", error);
    return { configured: false };
  }
  
  return data;
}

// Sync registrations to Google Sheets
export async function syncToGoogleSheets(
  eventId: string,
  spreadsheetId: string,
  sheetName: string = ""
): Promise<{ success: boolean; message: string; rowCount?: number; sheetName?: string }> {
  const { data, error } = await supabase.functions.invoke("sync-to-sheets", {
    body: { eventId, spreadsheetId, sheetName: sheetName || undefined },
  });

  if (error) {
    // Try to extract helpful error message from the response
    if (data?.hint) {
      const customError = new Error(data.hint) as Error & { hint?: string; serviceAccountEmail?: string };
      customError.hint = data.hint;
      customError.serviceAccountEmail = data.serviceAccountEmail;
      throw customError;
    }
    throw error;
  }
  
  // Check if response contains an error (403 responses come through data, not error)
  if (data?.error) {
    const customError = new Error(data.hint || data.error) as Error & { hint?: string; serviceAccountEmail?: string };
    customError.hint = data.hint;
    customError.serviceAccountEmail = data.serviceAccountEmail;
    throw customError;
  }
  
  return data;
}

// Helper to extract spreadsheet ID from URL
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Validate spreadsheet URL format
export function isValidSpreadsheetUrl(url: string): boolean {
  return /docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/.test(url);
}
