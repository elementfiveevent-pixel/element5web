import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface ValidateRequest {
  ticket_token: string;
  event_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { ticket_token, event_id }: ValidateRequest = await req.json();
    console.log(`Validating ticket for event ${event_id}, token: ${ticket_token?.slice(0, 8)}...`);

    if (!ticket_token || !event_id) {
      return new Response(
        JSON.stringify({ success: false, error: "MISSING_PARAMS", message: "ticket_token and event_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is the event organizer
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, organizer_id, start_date, status")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      console.log("Event not found:", eventError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "EVENT_NOT_FOUND", message: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (event.organizer_id !== user.id) {
      console.log(`User ${user.id} is not organizer of event ${event_id}`);
      return new Response(
        JSON.stringify({ success: false, error: "FORBIDDEN", message: "Only the event organizer can validate tickets" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up ticket by QR code or token hash
    const { data: ticket, error: ticketError } = await supabase
      .from("event_tickets")
      .select(`
        id,
        qr_code,
        is_used,
        used_at,
        abuse_flag,
        scan_attempts,
        user_id,
        registration_id
      `)
      .eq("event_id", event_id)
      .or(`qr_code.eq.${ticket_token},token_hash.eq.${ticket_token}`)
      .single();

    if (ticketError || !ticket) {
      console.log("Ticket not found:", ticketError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_TICKET",
          message: "Ticket not found for this event",
          valid: false
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get attendee profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, profile_photo_url, email")
      .eq("id", ticket.user_id)
      .single();

    // Get registration details
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("payment_status, created_at")
      .eq("id", ticket.registration_id)
      .single();

    // Build response based on ticket status
    const response = {
      success: true,
      valid: !ticket.is_used,
      ticket_id: ticket.id,
      status: ticket.is_used ? "ALREADY_USED" : "VALID",
      attendee: {
        name: profile?.full_name || "Unknown",
        avatar_url: profile?.profile_photo_url,
        email: profile?.email
      },
      event: {
        id: event.id,
        title: event.title,
        start_date: event.start_date
      },
      registration: {
        payment_status: registration?.payment_status,
        registered_at: registration?.created_at
      },
      warnings: [] as string[]
    };

    // Add warnings if applicable
    if (ticket.is_used) {
      response.warnings.push(`Ticket was already used at ${ticket.used_at}`);
    }
    if (ticket.abuse_flag) {
      response.warnings.push("This ticket has been flagged for potential abuse");
    }
    if (ticket.scan_attempts > 3) {
      response.warnings.push(`Multiple scan attempts detected (${ticket.scan_attempts})`);
    }

    console.log(`Ticket ${ticket.id} validated: ${response.status}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "SERVER_ERROR", message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
