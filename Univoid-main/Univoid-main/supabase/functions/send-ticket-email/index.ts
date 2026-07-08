import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SENDER_NAME = "UniVoid";
const SENDER_EMAIL = "heerpatel1032@gmail.com";

interface TicketEmailRequest {
  ticketId?: string;
  registrationId: string;
  eventId: string;
  userId: string;
  qrCode?: string;
  attendeesOnly?: boolean;
  resend?: boolean;
}

// Generate QR code PNG using external API and upload to storage
async function generateAndUploadQRCode(
  supabase: any,
  ticketId: string,
  qrData: string
): Promise<string | null> {
  try {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&format=png&margin=10`;
    const response = await fetch(qrApiUrl);
    if (!response.ok) return null;

    const pngBuffer = await response.arrayBuffer();
    const pngBytes = new Uint8Array(pngBuffer);
    const fileName = `qr-${ticketId}.png`;

    const { error } = await supabase.storage
      .from("ticket-qrcodes")
      .upload(fileName, pngBytes, { contentType: "image/png", upsert: true });

    if (error) return null;

    const { data: urlData } = supabase.storage
      .from("ticket-qrcodes")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error("QR generation/upload error:", error);
    return null;
  }
}

// Send email via Brevo REST API
async function sendEmailViaBrevo(
  to: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY not configured");

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent,
        headers: { "X-Priority": "1", "X-MSMail-Priority": "High", "Importance": "high" },
        tags: ["transactional", "ticket", "confirmation"],
      }),
    });

    const responseText = await response.text();
    if (!response.ok) return { success: false, error: `Brevo API error: ${response.status} - ${responseText}` };

    const result = JSON.parse(responseText);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Build QR code HTML block for a single ticket
function buildSingleQrHtml(qrImageUrl: string | null, ticketId: string, label?: string): string {
  const manualEntryCode = ticketId;
  const labelHtml = label ? `<p style="color: #374151; font-size: 12px; font-weight: 600; margin: 0 0 8px 0;">${label}</p>` : "";
  
  if (qrImageUrl) {
    return `<div style="display: inline-block; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 8px; vertical-align: top;">
${labelHtml}
<div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; display: inline-block;">
<img src="${qrImageUrl}" alt="Entry QR Code" width="140" height="140" style="display: block;" />
</div>
<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
<p style="color: #6b7280; font-size: 10px; margin: 0 0 4px 0;">Ticket ID:</p>
<p style="color: #1a1a1a; font-size: 9px; font-weight: 600; margin: 0; font-family: monospace; word-break: break-all; background: #f3f4f6; padding: 6px; border-radius: 4px;">${manualEntryCode}</p>
</div>
</div>`;
  }
  return `<div style="display: inline-block; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 8px; vertical-align: top;">
${labelHtml}
<div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
<p style="color: #6b7280; font-size: 10px; margin: 0 0 4px 0;">Ticket ID:</p>
<p style="color: #1a1a1a; font-size: 9px; font-weight: 600; margin: 0; font-family: monospace; word-break: break-all;">${manualEntryCode}</p>
</div>
</div>`;
}

// Build ticket email HTML with multiple QR codes
function buildTicketEmailHtml(
  recipientName: string,
  eventTitle: string,
  eventDate: string,
  locationText: string,
  organizerName: string | null,
  qrCodeSectionsHtml: string,
  ticketCount: number,
  isGuest: boolean
): string {
  const guestNote = isGuest
    ? `<p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0; font-style: italic;">This ticket was purchased on your behalf. You do not need an account to use it.</p>`
    : "";

  const ticketLabel = ticketCount > 1 ? `${ticketCount} Entry Passes` : "Entry Pass";
  const ticketInstruction = ticketCount > 1
    ? `<p style="color: #6b7280; font-size: 12px; margin: 12px 0 0 0;">Each QR code is a separate entry pass. Present one per person at the venue.</p>`
    : `<p style="color: #6b7280; font-size: 12px; margin: 12px 0 0 0;">Present this QR code at the venue.</p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ticket - ${eventTitle}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
<tr><td style="padding: 40px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
<tr><td align="center" style="padding-bottom: 24px;"><span style="color: #1a1a1a; font-size: 20px; font-weight: 700;">UniVoid</span></td></tr>
<tr><td>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
<tr><td style="background: #1a1a1a; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Registration Confirmed</h1></td></tr>
<tr><td style="padding: 24px;">
<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${recipientName},</p>
<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Your registration for <strong>${eventTitle}</strong> is confirmed. Below ${ticketCount > 1 ? 'are your entry passes' : 'is your entry pass'}.</p>
${guestNote}
<div style="text-align: center; margin: 24px 0;">
<p style="color: #1a1a1a; font-weight: 600; margin: 0 0 16px 0; font-size: 14px;">${ticketLabel}</p>
${qrCodeSectionsHtml}
${ticketInstruction}
</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 24px 0;">
<tr><td style="padding: 16px;">
<p style="margin: 0 0 12px 0; color: #1a1a1a; font-weight: 600; font-size: 14px;">Event Details</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 80px;">Event</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${eventTitle}</td></tr>
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Date</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${eventDate}</td></tr>
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Location</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${locationText}</td></tr>
${organizerName ? `<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Organizer</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${organizerName}</td></tr>` : ""}
</table>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
<tr><td align="center"><a href="https://univoid.tech/my-events" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">View Your Ticket</a></td></tr>
</table>
<p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 16px 0 0 0;">Please keep ${ticketCount > 1 ? 'these QR codes' : 'this QR code'} private and do not share ${ticketCount > 1 ? 'them' : 'it'} with others.</p>
</td></tr>
<tr><td style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="color: #9ca3af; font-size: 11px; margin: 0;">This is a transactional email from UniVoid regarding your event registration.</p>
</td></tr>
</table>
</td></tr></table>
</td></tr></table>
</body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (isCorsPreflightRequest(req)) return handleCorsPreflightRequest(req);
  const corsHeaders = getCorsHeaders(req);

  try {
    if (!BREVO_API_KEY) throw new Error("Email service not configured");

    const { ticketId, registrationId, eventId, userId, qrCode, attendeesOnly, resend }: TicketEmailRequest = await req.json();
    console.log("Processing ticket email:", { ticketId, registrationId, eventId, userId, attendeesOnly, resend });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user profile - fall back to auth.users if profile doesn't exist yet
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("full_name, email").eq("id", userId).single();
    
    let recipientEmail: string;
    let recipientName: string;
    
    if (profile && !profileError) {
      recipientEmail = profile.email;
      recipientName = profile.full_name;
    } else {
      // Profile not found — try auth.users (e.g., user signed up but hasn't completed onboarding)
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authError || !authUser?.user) {
        throw new Error("User not found in profiles or auth");
      }
      recipientEmail = authUser.user.email!;
      recipientName = authUser.user.user_metadata?.full_name || authUser.user.email!.split("@")[0];
      console.log(`⚠️ Profile not found, using auth user: ${recipientEmail}`);
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, start_date, venue_name, venue_address, city, state, is_paid, price, organizer_id")
      .eq("id", eventId).single();
    if (eventError || !event) throw new Error("Event not found");

    const { data: organizer } = await supabase
      .from("organizer_profiles").select("name").eq("user_id", event.organizer_id).single();

    const eventDate = new Date(event.start_date).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const locationText = event.venue_name
      ? `${event.venue_name}${event.city ? `, ${event.city}` : ""}${event.state ? `, ${event.state}` : ""}`
      : event.city && event.state ? `${event.city}, ${event.state}` : "Location TBA";

    const organizerName = organizer?.name || null;

    // --- Collect ALL tickets for this registration ---
    const { data: allTickets } = await supabase
      .from("event_tickets")
      .select("id, qr_code")
      .eq("registration_id", registrationId)
      .eq("event_id", eventId);

    const tickets = allTickets || [];
    
    // If triggered by notify_ticket_created (single ticket insert) but more tickets exist,
    // collect them all. For resend, we always use all tickets.
    let ticketsToEmail = tickets;
    
    // If only one ticket and we have the ticketId/qrCode from trigger, use it
    if (tickets.length === 0 && ticketId && qrCode) {
      ticketsToEmail = [{ id: ticketId, qr_code: qrCode }];
    }

    // --- Send primary ticket email to the registered user (skip if attendeesOnly) ---
    let result = { success: true, messageId: "" };
    if (!attendeesOnly && ticketsToEmail.length > 0) {
      // Generate QR codes for all tickets
      const qrSections: string[] = [];
      for (let i = 0; i < ticketsToEmail.length; i++) {
        const t = ticketsToEmail[i];
        const qrImageUrl = await generateAndUploadQRCode(supabase, t.id, t.qr_code);
        const label = ticketsToEmail.length > 1 ? `Pass ${i + 1}` : undefined;
        qrSections.push(buildSingleQrHtml(qrImageUrl, t.id, label));
      }

      const qrHtml = qrSections.join("\n");
      const emailHtml = buildTicketEmailHtml(
        recipientName, event.title, eventDate, locationText, organizerName,
        qrHtml, ticketsToEmail.length, false
      );

      result = await sendEmailViaBrevo(
        recipientEmail, recipientName,
        `Your Ticket Confirmation - ${event.title}`, emailHtml
      );

      if (!result.success) throw new Error(`Email delivery failed: ${result.error}`);
      console.log(`✅ Primary ticket email sent to: ${recipientEmail} (${ticketsToEmail.length} QR codes)`);
    } else if (!attendeesOnly) {
      console.log("⚠️ No tickets found for registration, skipping primary email");
    } else {
      console.log("⏭️ Skipping primary user email (attendeesOnly mode)");
    }

    // --- Send individual QR emails to guest attendees ---
    let guestEmailsSent = 0;
    try {
      const { data: attendees } = await supabase
        .from("ticket_attendees")
        .select("id, attendee_name, attendee_email, attendee_mobile, ticket_category_id, ticket_id, qr_code")
        .eq("registration_id", registrationId);

      if (attendees && attendees.length > 0) {
        // Filter out the primary user's own email to avoid duplicate
        const guestAttendees = attendees.filter(
          (a: any) => a.attendee_email && a.attendee_email.toLowerCase() !== recipientEmail.toLowerCase()
        );

        for (const attendee of guestAttendees) {
          try {
            let guestTicketId = attendee.ticket_id;
            let guestQrCode = attendee.qr_code;

            // If no ticket yet (shouldn't happen after trigger fix, but safety fallback)
            if (!guestTicketId) {
              const qrCodeVal = `${eventId}:attendee:${attendee.id}:${crypto.randomUUID().slice(0, 8)}`;
              const { data: ticket, error } = await supabase
                .from("event_tickets")
                .insert({
                  registration_id: registrationId,
                  event_id: eventId,
                  user_id: userId,
                  qr_code: qrCodeVal,
                  is_used: false,
                  is_group_booking: true,
                })
                .select("id")
                .single();

              if (error || !ticket) {
                console.error(`Could not create ticket for attendee ${attendee.id}, skipping`);
                continue;
              }
              guestTicketId = ticket.id;
              guestQrCode = qrCodeVal;

              await supabase
                .from("ticket_attendees")
                .update({ ticket_id: ticket.id, qr_code: qrCodeVal })
                .eq("id", attendee.id);
            }

            const guestQrUrl = await generateAndUploadQRCode(supabase, guestTicketId, guestQrCode);
            const guestQrHtml = buildSingleQrHtml(guestQrUrl, guestTicketId);
            const guestHtml = buildTicketEmailHtml(
              attendee.attendee_name, event.title, eventDate, locationText, organizerName,
              guestQrHtml, 1, true
            );

            const guestResult = await sendEmailViaBrevo(
              attendee.attendee_email, attendee.attendee_name,
              `Your Ticket - ${event.title}`, guestHtml
            );

            if (guestResult.success) guestEmailsSent++;
            console.log(`Guest email ${guestResult.success ? "sent" : "failed"}: ${attendee.attendee_email}`);
          } catch (guestError) {
            console.error(`Failed to send guest email to ${attendee.attendee_email}:`, guestError);
          }
        }
      }
    } catch (attendeeError) {
      console.error("Error processing guest attendees:", attendeeError);
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId,
      recipient: recipientEmail,
      ticketCount: ticketsToEmail.length,
      guestEmailsSent,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ ERROR in send-ticket-email:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
