import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Brevo API Configuration
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SENDER_NAME = "UniVoid";
const SENDER_EMAIL = "heerpatel1032@gmail.com";

interface StatusEmailRequest {
  registrationId: string;
  status: "approved" | "rejected";
  eventId: string;
  userId: string;
  qrCode?: string; // The generated QR code string
}

// Generate QR code PNG using external API and upload to storage
async function generateAndUploadQRCode(
  supabase: any,
  registrationId: string,
  qrData: string
): Promise<string | null> {
  try {
    // Use Google Charts API to generate QR code as PNG
    const qrApiUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(qrData)}&choe=UTF-8&chld=M|4`;
    
    console.log("Fetching QR PNG from Google Charts API...");
    const response = await fetch(qrApiUrl);
    
    if (!response.ok) {
      console.error("QR API error:", response.status);
      return null;
    }
    
    const pngBuffer = await response.arrayBuffer();
    const pngBytes = new Uint8Array(pngBuffer);
    
    console.log("QR PNG fetched, size:", pngBytes.length, "bytes");
    
    // Upload PNG to storage
    const fileName = `qr-reg-${registrationId}.png`;
    
    const { error } = await supabase.storage
      .from("ticket-qrcodes")
      .upload(fileName, pngBytes, {
        contentType: "image/png",
        upsert: true,
      });
    
    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("ticket-qrcodes")
      .getPublicUrl(fileName);
    
    console.log("QR PNG uploaded successfully:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("QR generation/upload error:", error);
    return null;
  }
}

// Send email via Brevo REST API
async function sendEmailViaBrevo(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_SMTP_PASSWORD not configured");
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
      console.error("Brevo API error:", errorText);
      return { success: false, error: `Brevo API error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    console.log("Email sent successfully via Brevo:", result);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("Brevo send error:", error);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Registration status email function called");

  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Check Brevo API key
    if (!BREVO_API_KEY) {
      console.error("CRITICAL: BREVO_SMTP_PASSWORD is missing!");
      throw new Error("Email service not configured");
    }
    console.log("Brevo API key verified ✓");

    const { registrationId, status, eventId, userId, qrCode }: StatusEmailRequest = await req.json();
    console.log("Processing status email:", { registrationId, status, eventId, userId, hasQR: !!qrCode });

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError);
      throw new Error("User profile not found");
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, start_date, venue_name, venue_address")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      throw new Error("Event not found");
    }

    const isApproved = status === "approved";
    const statusColor = isApproved ? "#22c55e" : "#ef4444";
    const statusText = isApproved ? "Approved" : "Rejected";
    const statusEmoji = isApproved ? "✅" : "❌";

    const eventDate = new Date(event.start_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generate and upload QR code as PNG for reliable email display
    let qrCodeImageHtml = "";
    if (qrCode && isApproved) {
      try {
        console.log("Generating QR code PNG for registration:", registrationId);
        
        const qrImageUrl = await generateAndUploadQRCode(supabase, registrationId, qrCode);

        if (qrImageUrl) {
          qrCodeImageHtml = `
            <div style="text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px;">
              <p style="color: #374151; font-weight: 600; margin-bottom: 16px;">🎫 Your Entry QR Code</p>
              <img src="${qrImageUrl}" alt="Event Entry QR Code" width="200" height="200" style="display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
              <p style="color: #6b7280; font-size: 12px; margin-top: 12px;">Show this QR code at the entry gate</p>
            </div>
          `;
        } else {
          // Fallback to link
          qrCodeImageHtml = `
            <div style="text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px;">
              <p style="color: #374151; font-weight: 600; margin-bottom: 16px;">🎫 Your Entry Pass</p>
              <a href="https://univoid.tech/my-tickets" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Your QR Ticket</a>
              <p style="color: #6b7280; font-size: 12px; margin-top: 12px;">Click to view your QR code for event entry</p>
            </div>
          `;
        }
      } catch (qrError) {
        console.error("QR generation error:", qrError);
        qrCodeImageHtml = `<p style="color: #ef4444; text-align: center;">QR code could not be generated. Please visit <a href="https://univoid.tech/my-tickets">My Tickets</a> to view your QR.</p>`;
      }
    }

    const approvedContent = `
      <p>Great news! Your registration has been approved. Here's your entry pass:</p>
      ${qrCodeImageHtml}
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; color: #374151;"><strong>📅 Event:</strong> ${event.title}</p>
        <p style="margin: 0 0 8px 0; color: #374151;"><strong>🗓️ Date:</strong> ${eventDate}</p>
        ${event.venue_name ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>📍 Venue:</strong> ${event.venue_name}</p>` : ""}
        ${event.venue_address ? `<p style="margin: 0; color: #374151;"><strong>🏠 Address:</strong> ${event.venue_address}</p>` : ""}
      </div>
      <div style="background: #eef2ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <p style="margin: 0; color: #374151;">📱 <strong>Access Your Ticket:</strong> You can access your ticket on the <strong>My Tickets</strong> page. You can also view it using this link: <a href="https://univoid.tech/my-tickets" style="color: #4f46e5; font-weight: 600;">https://univoid.tech/my-tickets</a></p>
      </div>
      <p style="color: #dc2626; font-weight: 600; text-align: center;">⚠️ Do NOT share this QR code with anyone!</p>
    `;

    const rejectedContent = `
      <p>Unfortunately, your registration for <strong>${event.title}</strong> has been declined.</p>
      <p style="color: #6b7280; margin-top: 16px;">This could be due to incomplete payment verification or limited capacity. If you believe this is an error, please contact the event organizer.</p>
    `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration ${statusText}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">✨ UniVoid</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Event Registration Update</p>
            </div>
            <div style="background: ${statusColor}; padding: 16px; text-align: center;">
              <h2 style="color: white; margin: 0; font-size: 20px;">${statusEmoji} Registration ${statusText}</h2>
            </div>
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hi ${profile.full_name},</p>
              ${isApproved ? approvedContent : rejectedContent}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} UniVoid. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Sending status email to:", profile.email);
    console.log("Email HTML length:", emailHtml.length);

    // Send email via Brevo
    const result = await sendEmailViaBrevo(
      profile.email,
      `${statusEmoji} Registration ${statusText}: ${event.title}`,
      emailHtml
    );

    if (!result.success) {
      console.error("BREVO EMAIL FAILED:", result.error);
      throw new Error(`Email delivery failed: ${result.error}`);
    }

    console.log("✅ EMAIL SENT SUCCESSFULLY via Brevo:", { messageId: result.messageId, to: profile.email });

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId,
      recipient: profile.email
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ ERROR in send-registration-status-email:", error.message);
    console.error("Full error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: "Email could not be sent. Please check Brevo dashboard for details."
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);