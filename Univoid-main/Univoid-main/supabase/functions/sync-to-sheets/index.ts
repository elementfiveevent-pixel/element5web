import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface SheetSyncRequest {
  action?: "sync" | "get-info";
  eventId?: string;
  spreadsheetId?: string;
  sheetName?: string;
}

interface FormField {
  id: string;
  label: string;
  field_type: string;
  field_order: number;
  is_required: boolean;
  options?: { label: string; value: string }[] | null;
}

interface Registration {
  id: string;
  created_at: string;
  payment_status: string;
  custom_data: Record<string, unknown> | null;
  user_id: string;
  group_size?: number;
  is_group_booking?: boolean;
  base_amount?: number;
  addons_amount?: number;
  total_amount?: number;
  payment_screenshot_url?: string | null;
  reviewed_at?: string | null;
  profile?: {
    full_name?: string;
    email?: string;
    mobile_number?: string;
    college_name?: string;
  } | null;
  addons?: RegistrationAddon[];
  attendees?: TicketAttendee[];
}

interface RegistrationAddon {
  id: string;
  upsell_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  custom_input_value?: string;
  upsell?: {
    name: string;
    upsell_type: string;
    allow_custom_input?: boolean;
  };
}

interface TicketAttendee {
  attendee_name: string;
  attendee_email: string;
  attendee_mobile: string;
  category_name?: string;
  category_price?: number;
}

interface EventUpsell {
  id: string;
  name: string;
  upsell_type: string;
  allow_custom_input?: boolean;
}

serve(async (req) => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKey) {
      throw new Error("Google Service Account not configured");
    }

    const body = await req.json();
    const { action = "sync", eventId, spreadsheetId, sheetName } = body as SheetSyncRequest;

    // Handle get-info action - just return service account email
    if (action === "get-info") {
      try {
        const credentials = JSON.parse(serviceAccountKey);
        return new Response(
          JSON.stringify({
            serviceAccountEmail: credentials.client_email,
            configured: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ configured: false, error: "Invalid service account configuration" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For sync action, validate required fields
    if (!eventId || !spreadsheetId) {
      throw new Error("Missing eventId or spreadsheetId");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting dynamic sync for event: ${eventId}`);

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, start_date, organizer_id, is_paid, price")
      .eq("id", eventId)
      .single();

    if (eventError) throw eventError;

    // Fetch form fields for the event (sorted by field_order)
    const { data: formFields, error: fieldsError } = await supabase
      .from("event_form_fields")
      .select("id, label, field_type, field_order, is_required, options")
      .eq("event_id", eventId)
      .order("field_order", { ascending: true });

    if (fieldsError) {
      console.error("Error fetching form fields:", fieldsError);
      // Continue without form fields - use fallback columns
    }

    console.log(`Found ${formFields?.length || 0} custom form fields`);

    // Fetch event upsells for column headers
    const { data: eventUpsells, error: upsellsError } = await supabase
      .from("event_upsells")
      .select("id, name, upsell_type, allow_custom_input")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (upsellsError) {
      console.error("Error fetching upsells:", upsellsError);
    }

    console.log(`Found ${eventUpsells?.length || 0} event upsells`);

    // Fetch registrations with amount columns and payment screenshot
    const { data: registrations, error: regError } = await supabase
      .from("event_registrations")
      .select("id, created_at, payment_status, custom_data, user_id, base_amount, addons_amount, total_amount, group_size, is_group_booking, payment_screenshot_url, reviewed_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (regError) throw regError;

    // Fetch profiles separately for all user_ids
    const userIds = (registrations || []).map(r => r.user_id).filter(Boolean);
    let profileMap = new Map<string, { full_name?: string; email?: string; mobile_number?: string; college_name?: string }>();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, mobile_number, college_name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else {
        (profiles || []).forEach(p => profileMap.set(p.id, p));
      }
    }

    // Fetch registration addons with upsell details
    const regIds = (registrations || []).map(r => r.id);
    let addonsMap = new Map<string, RegistrationAddon[]>();

    if (regIds.length > 0) {
      const { data: allAddons, error: addonsError } = await supabase
        .from("registration_addons")
        .select("id, registration_id, upsell_id, quantity, unit_price, total_price, custom_input_value")
        .in("registration_id", regIds);

      if (addonsError) {
        console.error("Error fetching registration addons:", addonsError);
      } else {
        // Group addons by registration_id
        (allAddons || []).forEach(addon => {
          const regAddons = addonsMap.get(addon.registration_id) || [];
          // Find upsell name from eventUpsells
          const upsell = eventUpsells?.find(u => u.id === addon.upsell_id);
          regAddons.push({
            ...addon,
            upsell: upsell || undefined
          });
          addonsMap.set(addon.registration_id, regAddons);
        });
      }
    }

    // Fetch ticket attendees for all registrations
    let attendeesMap = new Map<string, TicketAttendee[]>();
    if (regIds.length > 0) {
      const { data: allAttendees, error: attendeesError } = await supabase
        .from("ticket_attendees")
        .select("registration_id, attendee_name, attendee_email, attendee_mobile, ticket_category_id")
        .in("registration_id", regIds);

      if (attendeesError) {
        console.error("Error fetching attendees:", attendeesError);
      } else {
        // Fetch category names
        const catIds = [...new Set((allAttendees || []).map(a => a.ticket_category_id).filter(Boolean))];
        let catMap = new Map<string, { name: string; price: number }>();
        if (catIds.length > 0) {
          const { data: cats } = await supabase
            .from("ticket_categories")
            .select("id, name, price")
            .in("id", catIds);
          (cats || []).forEach(c => catMap.set(c.id, { name: c.name, price: c.price }));
        }

        (allAttendees || []).forEach(att => {
          const regAtts = attendeesMap.get(att.registration_id) || [];
          const cat = catMap.get(att.ticket_category_id);
          regAtts.push({
            attendee_name: att.attendee_name,
            attendee_email: att.attendee_email,
            attendee_mobile: att.attendee_mobile,
            category_name: cat?.name || "",
            category_price: cat?.price ?? 0,
          });
          attendeesMap.set(att.registration_id, regAtts);
        });
      }
    }

    console.log(`Found ${registrations?.length || 0} registrations, ${profileMap.size} profiles`);

    // Attach profiles, addons, and attendees to registrations
    const registrationsWithProfiles = (registrations || []).map(reg => ({
      ...reg,
      profile: profileMap.get(reg.user_id) || null,
      addons: addonsMap.get(reg.id) || [],
      attendees: attendeesMap.get(reg.id) || [],
    })) as Registration[];

    // Parse service account key
    const credentials = JSON.parse(serviceAccountKey);

    // Get access token using JWT
    const accessToken = await getGoogleAccessToken(credentials);

    // Validate sheet access before proceeding
    const validationResult = await validateSheetAccess(accessToken, spreadsheetId, credentials.client_email);
    if (!validationResult.accessible) {
      return new Response(
        JSON.stringify({
          error: validationResult.error,
          hint: validationResult.hint,
          serviceAccountEmail: credentials.client_email
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine actual sheet name - use provided if it exists, otherwise use first sheet
    let actualSheetName = validationResult.firstSheetName || "Sheet1";

    if (sheetName && sheetName.trim()) {
      // Check if the requested sheet exists
      const sheetExists = validationResult.allSheetNames?.includes(sheetName.trim());
      if (sheetExists) {
        actualSheetName = sheetName.trim();
      } else {
        console.log(`Requested sheet "${sheetName}" not found, using first sheet "${actualSheetName}" instead`);
      }
    }

    console.log(`Using sheet name: ${actualSheetName}`);

    // Build dynamic headers with upsells
    const headers = buildDynamicHeaders(formFields || [], event, eventUpsells || []);

    // Build rows - one row per attendee (or one row per registration if no attendees)
    const rows: string[][] = [];
    for (const reg of registrationsWithProfiles) {
      const attendees = reg.attendees || [];
      if (attendees.length > 0) {
        // One row per attendee
        for (let i = 0; i < attendees.length; i++) {
          rows.push(buildDynamicRow(reg, formFields || [], event, eventUpsells || [], attendees[i], i + 1, attendees.length));
        }
      } else {
        // No attendees - single row for registration
        rows.push(buildDynamicRow(reg, formFields || [], event, eventUpsells || [], null, 0, 0));
      }
    }

    console.log(`Syncing ${rows.length} rows (attendee-level) with ${headers.length} columns`);

    // Clear and update sheet
    await clearSheet(accessToken, spreadsheetId, actualSheetName);
    await updateSheet(accessToken, spreadsheetId, actualSheetName, [headers, ...rows]);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${rows.length} registrations to sheet "${actualSheetName}"`,
        rowCount: rows.length,
        columnCount: headers.length,
        sheetName: actualSheetName
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sheets sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Build dynamic column headers based on form schema and upsells
function buildDynamicHeaders(
  formFields: FormField[],
  event: { is_paid: boolean; title: string },
  eventUpsells: EventUpsell[]
): string[] {
  const fixedHeaders = [
    "Timestamp",
    "Registration ID",
    "Registrant Name",
    "Registrant Email",
    "Registrant Mobile",
    "College",
    "Payment Status",
    "Group Entry",
    "Group Size",
  ];

  // Payment & financial columns
  fixedHeaders.push(
    "Base Amount (₹)",
    "Add-ons Amount (₹)",
    "Total Amount (₹)",
    "Payment Screenshot URL",
    "Reviewed At",
  );

  // Club membership
  fixedHeaders.push("Club Member", "Club Name", "Club Membership ID");

  // Ticket category breakdown
  fixedHeaders.push("Ticket Categories Summary");

  // Per-attendee columns
  fixedHeaders.push(
    "Attendee #",
    "Total Attendees",
    "Attendee Name",
    "Attendee Email",
    "Attendee Mobile",
    "Attendee Ticket Category",
    "Attendee Ticket Price (₹)",
  );

  // Dynamic form field columns
  const dynamicHeaders = formFields.map(field => field.label);

  // Upsell columns
  const upsellHeaders: string[] = [];
  for (const upsell of eventUpsells) {
    if (upsell.upsell_type === 'addon' || upsell.upsell_type === 'custom_addon') {
      upsellHeaders.push(`Add-on: ${upsell.name}`);
      if (upsell.allow_custom_input) {
        upsellHeaders.push(`${upsell.name} (Input)`);
      }
    } else if (upsell.upsell_type === 'group_offer') {
      upsellHeaders.push(`Offer: ${upsell.name}`);
    }
  }

  return [...fixedHeaders, ...dynamicHeaders, ...upsellHeaders];
}

// Build a single row — called once per attendee (or once per registration if no attendees)
function buildDynamicRow(
  reg: Registration,
  formFields: FormField[],
  event: { is_paid: boolean },
  eventUpsells: EventUpsell[],
  attendee: TicketAttendee | null,
  attendeeIndex: number,
  totalAttendees: number,
): string[] {
  const customData = reg.custom_data || {};
  const profile = reg.profile;
  const addons = reg.addons || [];

  const row: string[] = [
    reg.created_at ? new Date(reg.created_at).toLocaleString() : "",
    String(reg.id || ""),
    String(profile?.full_name || ""),
    String(profile?.email || ""),
    String(profile?.mobile_number || ""),
    String(profile?.college_name || ""),
    String(reg.payment_status || ""),
    reg.is_group_booking ? "Yes" : "No",
    String(reg.group_size || 1),
  ];

  // Financial columns (no more separate "Ticket Price" — price comes from attendee's category)
  row.push(String(reg.base_amount ?? ""));
  row.push(String(reg.addons_amount ?? "0"));
  row.push(String(reg.total_amount ?? ""));
  row.push(String(reg.payment_screenshot_url || ""));
  row.push(reg.reviewed_at ? new Date(reg.reviewed_at).toLocaleString() : "");

  // Club membership
  const isClubMember = Boolean(customData._club_id || customData._is_club_member);
  row.push(isClubMember ? "Yes" : "No");
  row.push(String(customData._club_name || ""));
  row.push(String(customData._club_membership_id || customData._membership_id || ""));

  // Ticket categories summary
  const ticketCats = customData._ticket_categories as Array<{ category_name: string; quantity: number; price_per: number; total: number }> | undefined;
  if (ticketCats && Array.isArray(ticketCats)) {
    row.push(ticketCats.map(tc => `${tc.category_name} ×${tc.quantity} @₹${tc.price_per ?? 0} = ₹${tc.total}`).join("; "));
  } else {
    row.push("");
  }

  // Per-attendee columns
  if (attendee) {
    row.push(String(attendeeIndex));
    row.push(String(totalAttendees));
    row.push(String(attendee.attendee_name || ""));
    row.push(String(attendee.attendee_email || ""));
    row.push(String(attendee.attendee_mobile || ""));
    row.push(String(attendee.category_name || ""));
    row.push(String(attendee.category_price ?? ""));
  } else {
    row.push("", "", "", "", "", "", "");
  }

  // Dynamic form fields
  for (const field of formFields) {
    try {
      row.push(getFieldValue(customData, field));
    } catch {
      row.push("");
    }
  }

  // Upsell values
  for (const upsell of eventUpsells) {
    const regAddon = addons.find(a => a.upsell_id === upsell.id);
    if (upsell.upsell_type === 'addon' || upsell.upsell_type === 'custom_addon') {
      row.push(regAddon ? String(regAddon.quantity) : "0");
      if (upsell.allow_custom_input) {
        row.push(regAddon?.custom_input_value || "");
      }
    } else if (upsell.upsell_type === 'group_offer') {
      row.push(regAddon ? "Applied" : "Not Applied");
    }
  }

  return row;
}

// Extract field value from custom_data
function getFieldValue(
  customData: Record<string, unknown>,
  field: FormField
): string {
  // Try multiple key formats (field ID, label, lowercase label)
  const possibleKeys = [
    field.id,
    field.label,
    field.label.toLowerCase(),
    field.label.toLowerCase().replace(/\s+/g, "_"),
    field.label.replace(/\s+/g, "_"),
  ];

  let value: unknown = undefined;

  for (const key of possibleKeys) {
    if (key in customData) {
      value = customData[key];
      break;
    }
  }

  if (value === undefined || value === null) {
    return "";
  }

  // Handle different field types
  switch (field.field_type) {
    case "checkbox":
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return value === true ? "Yes" : value === false ? "No" : String(value);

    case "file":
      if (typeof value === "string" && value.startsWith("http")) {
        return value; // Return file URL
      }
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return String(value || "");

    case "select":
    case "radio":
      // Try to get the label from options if value is a key
      if (field.options && Array.isArray(field.options)) {
        const option = field.options.find(
          (opt) => opt.value === value || opt.label === value
        );
        if (option) {
          return option.label;
        }
      }
      return String(value);

    case "date":
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (typeof value === "string") {
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      }
      return String(value);

    case "datetime":
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      if (typeof value === "string") {
        try {
          return new Date(value).toLocaleString();
        } catch {
          return value;
        }
      }
      return String(value);

    default:
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return String(value);
  }
}

async function getGoogleAccessToken(credentials: { client_email: string; private_key: string }) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Create JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import private key and sign
  const privateKey = credentials.private_key.replace(/\\n/g, "\n");
  const pemContents = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    throw new Error(`Google auth error: ${tokenData.error_description || tokenData.error}`);
  }

  return tokenData.access_token;
}

// Validate that the sheet is accessible with proper permissions
async function validateSheetAccess(
  accessToken: string,
  spreadsheetId: string,
  serviceAccountEmail: string
): Promise<{ accessible: boolean; error?: string; hint?: string; firstSheetName?: string; allSheetNames?: string[] }> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || "Unknown error";
      const errorCode = errorData.error?.code || response.status;

      console.error(`Sheet access validation failed: ${errorCode} - ${errorMessage}`);

      // Handle specific error codes with helpful messages
      if (errorCode === 404) {
        return {
          accessible: false,
          error: "Spreadsheet not found",
          hint: "The spreadsheet URL may be incorrect or the spreadsheet has been deleted. Please check the URL and try again."
        };
      }

      if (errorCode === 403) {
        return {
          accessible: false,
          error: "Access denied to spreadsheet",
          hint: `The spreadsheet is not shared with the service account. Please share your Google Sheet with this email address as an Editor: ${serviceAccountEmail}`
        };
      }

      return {
        accessible: false,
        error: `Cannot access spreadsheet: ${errorMessage}`,
        hint: `Please ensure the spreadsheet is shared with: ${serviceAccountEmail}`
      };
    }

    const data = await response.json();
    const allSheetNames = data.sheets?.map((s: { properties: { title: string } }) => s.properties.title) || [];
    const firstSheetName = allSheetNames[0] || "Sheet1";

    console.log(`Sheet access validated successfully. Available sheets: ${allSheetNames.join(", ")}`);

    return { accessible: true, firstSheetName, allSheetNames };
  } catch (error) {
    console.error("Sheet validation error:", error);
    return {
      accessible: false,
      error: "Failed to validate sheet access",
      hint: `Please check that the spreadsheet URL is correct and shared with: ${serviceAccountEmail}`
    };
  }
}

// Get the first sheet name from the spreadsheet (fallback function)
async function getFirstSheetName(accessToken: string, spreadsheetId: string): Promise<string> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get sheet info: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  if (data.sheets && data.sheets.length > 0) {
    return data.sheets[0].properties.title;
  }
  return "Sheet1"; // Default fallback
}

async function clearSheet(accessToken: string, spreadsheetId: string, sheetName: string) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // Ignore errors on clear - sheet might be empty
  if (!response.ok) {
    console.log(`Clear sheet warning (continuing anyway): ${response.status}`);
  }
}

async function updateSheet(accessToken: string, spreadsheetId: string, sheetName: string, data: string[][]) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: data }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Sheets API error: ${error.error?.message || "Unknown error"}`);
  }
}
