import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Brevo API Configuration
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SENDER_NAME = "UniVoid";
const SENDER_EMAIL = "heerpatel1032@gmail.com";

interface EventEmailRequest {
  eventId: string;
  subject: string;
  body: string;
  senderId: string;
}

// Send email via Brevo REST API
async function sendEmailViaBrevo(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }
    
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Brevo API error for ${to}:`, response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

// Generate organizer email HTML
function generateEventEmail(
  eventTitle: string,
  userName: string,
  messageBody: string
): string {
  // Replace placeholders
  const personalizedMessage = messageBody
    .replace(/\{\{userName\}\}/g, userName)
    .replace(/\{\{eventName\}\}/g, eventTitle);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Message from ${eventTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f5;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                    ✨ UniVoid
                  </h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">
                    Event Communication
                  </p>
                </td>
              </tr>
              
              <!-- Event Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; text-align: center;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
                    📢 ${eventTitle}
                  </h2>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
                  <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                    Hi ${userName},
                  </p>
                  
                  <div style="color: #374151; font-size: 16px; line-height: 1.7;">
                    ${personalizedMessage.split('\n').map(line => `<p style="margin: 0 0 12px 0;">${line}</p>`).join('')}
                  </div>
                  
                  <!-- Ticket Access Notice -->
                  <div style="margin-top: 24px; padding: 16px; background: #eef2ff; border-radius: 8px; border-left: 4px solid #6366f1;">
                    <p style="margin: 0; color: #374151; font-size: 14px;">
                      📱 <strong>Access Your Ticket:</strong> You can access your ticket from the <strong>My Tickets</strong> page. 
                      <br>
                      <a href="https://univoid.tech/my-events" style="color: #4f46e5; font-weight: 600;">https://univoid.tech/my-events</a>
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 24px 32px; text-align: center;">
                  <p style="color: #666666; font-size: 12px; margin: 0 0 8px 0;">
                    This email was sent by the event organizer through UniVoid.
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} UniVoid. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Add delay between emails
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Event email function called");

  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const { eventId, subject, body, senderId }: EventEmailRequest = await req.json();

    if (!eventId || !subject || !body || !senderId) {
      throw new Error("Missing required fields: eventId, subject, body, senderId");
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the sender is the organizer of this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, organizer_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    if (event.organizer_id !== senderId) {
      throw new Error("Unauthorized: You are not the organizer of this event");
    }

    // Fetch registered attendees with approved status
    const { data: registrations, error: regError } = await supabase
      .from("event_registrations")
      .select("user_id")
      .eq("event_id", eventId)
      .eq("payment_status", "approved");

    if (regError) {
      console.error("Failed to fetch registrations:", regError);
      throw new Error("Failed to fetch attendee list");
    }

    if (!registrations || registrations.length === 0) {
      // Log the attempt
      await supabase.from("email_logs").insert({
        sender_id: senderId,
        sender_type: "organizer",
        event_id: eventId,
        subject,
        body_preview: body.substring(0, 200),
        recipients_count: 0,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      return new Response(JSON.stringify({
        success: true,
        message: "No approved attendees to email",
        sent: 0,
        failed: 0,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get user IDs
    const userIds = registrations.map(r => r.user_id);

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)
      .eq("is_disabled", false);

    if (profilesError) {
      console.error("Failed to fetch profiles:", profilesError);
      throw new Error("Failed to fetch user profiles");
    }

    console.log(`Sending event email to ${profiles?.length || 0} attendees for event: ${event.title}`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails with rate limiting
    for (const profile of profiles || []) {
      if (!profile.email) continue;

      const emailHtml = generateEventEmail(
        event.title,
        profile.full_name || "Attendee",
        body
      );

      console.log(`Sending to ${profile.email}...`);
      const result = await sendEmailViaBrevo(profile.email, subject, emailHtml);
      
      if (result.success) {
        sent++;
        console.log(`✅ Sent to ${profile.email}`);
      } else {
        failed++;
        errors.push(`${profile.email}: ${result.error}`);
        console.error(`❌ Failed: ${profile.email} - ${result.error}`);
      }

      // Rate limit: 100ms delay between emails
      await delay(100);
    }

    // Log the email send
    await supabase.from("email_logs").insert({
      sender_id: senderId,
      sender_type: "organizer",
      event_id: eventId,
      subject,
      body_preview: body.substring(0, 200),
      recipients_count: sent + failed,
      status: failed === 0 ? "sent" : sent === 0 ? "failed" : "partial",
      error_message: errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
      sent_at: new Date().toISOString(),
    });

    console.log(`Event email complete: ${sent} sent, ${failed} failed`);

    return new Response(JSON.stringify({
      success: sent > 0,
      message: `Email sent to attendees`,
      total: (profiles?.length || 0),
      sent,
      failed,
      errors: errors.slice(0, 5),
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Event email error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
