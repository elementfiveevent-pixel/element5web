import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SENDER_NAME = "UniVoid";
const SENDER_EMAIL = "heerpatel1032@gmail.com";

interface RegistrationNotifyRequest {
  eventId: string;
  registrantName: string;
  eventTitle: string;
  isPaid: boolean;
  ticketPrice?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (isCorsPreflightRequest(req)) return handleCorsPreflightRequest(req);
  const corsHeaders = getCorsHeaders(req);

  try {
    if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY not configured");

    const { eventId, registrantName, eventTitle, isPaid, ticketPrice }: RegistrationNotifyRequest = await req.json();

    if (!eventId) throw new Error("eventId is required");

    // Create Supabase client to fetch organizer details
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch event with organizer info
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_id, title, registrations_count, max_capacity, is_paid, start_date")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      throw new Error("Event not found");
    }

    // Fetch organizer profile
    const { data: organizer, error: orgError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", event.organizer_id)
      .single();

    if (orgError || !organizer) {
      console.error("Organizer profile fetch error:", orgError);
      throw new Error("Organizer profile not found");
    }

    const eventDate = new Date(event.start_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const capacityInfo = event.max_capacity
      ? `${event.registrations_count} / ${event.max_capacity} spots filled`
      : `${event.registrations_count} registrations so far`;

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Registration</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
<tr><td style="padding: 40px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
<tr><td align="center" style="padding-bottom: 24px;"><span style="color: #1a1a1a; font-size: 20px; font-weight: 700;">UniVoid</span></td></tr>
<tr><td>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
<tr><td style="background: #1a1a1a; padding: 24px; text-align: center;">
<h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">New Registration Received</h1>
</td></tr>
<tr><td style="padding: 24px;">
<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${organizer.full_name || 'Organizer'},</p>
<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
<strong>${registrantName}</strong> has registered for your event <strong>${eventTitle || event.title}</strong>.
${isPaid ? ' Their payment is pending your verification.' : ''}
</p>
${isPaid ? `<div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0;">
<p style="color: #92400e; font-size: 13px; margin: 0;">Action Required - Please review and approve/reject the payment in your organizer dashboard.</p>
</div>` : `<div style="background: #ecfdf5; border: 1px solid #34d399; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0;">
<p style="color: #065f46; font-size: 13px; margin: 0;">This is a free event — the registration has been auto-confirmed and the attendee has received their ticket.</p>
</div>`}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 0 0 24px 0;">
<tr><td style="padding: 16px;">
<p style="margin: 0 0 12px 0; color: #1a1a1a; font-weight: 600; font-size: 14px;">Registration Details</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 100px;">Registrant</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${registrantName}</td></tr>
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Event</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${eventTitle || event.title}</td></tr>
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Date</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${eventDate}</td></tr>
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Capacity</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${capacityInfo}</td></tr>
${isPaid && ticketPrice ? `<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Amount</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">₹${ticketPrice}</td></tr>` : ''}
</table>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 16px 0;">
<tr><td align="center"><a href="https://univoid.tech/organizer" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">${isPaid ? 'Review Registration' : 'View Dashboard'}</a></td></tr>
</table>
</td></tr>
<tr><td style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="color: #9ca3af; font-size: 11px; margin: 0;">This is a transactional email from UniVoid regarding your event registrations.</p>
</td></tr>
</table>
</td></tr></table>
</td></tr></table>
</body></html>`;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: organizer.email, name: organizer.full_name }],
        subject: `New Registration: ${registrantName} - ${eventTitle || event.title}`,
        htmlContent: emailHtml,
        headers: { "X-Priority": "1", "X-MSMail-Priority": "High", "Importance": "high" },
        tags: ["transactional", "organizer-notification", "registration"],
      }),
    });

    const responseText = await response.text();
    if (!response.ok) throw new Error(`Brevo API error: ${response.status} - ${responseText}`);

    const result = JSON.parse(responseText);
    console.log("✅ Organizer notification email sent to:", organizer.email);

    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error in send-registration-email:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
