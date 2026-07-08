import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Brevo API Configuration
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SENDER_NAME = Deno.env.get("SENDER_NAME") || "UniVoid";
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "no-reply@univoid.in";

// Email types
type EmailType = 
  | "login_notification"
  | "event_created"
  | "event_registration"
  | "partner_request"
  | "area_request";

interface EmailRequest {
  type: EmailType;
  recipientEmail: string;
  recipientName?: string;
  data: Record<string, unknown>;
}

// Base64 encode for SMTP AUTH
function base64Encode(str: string): string {
  return btoa(str);
}

// Basic input sanitization
function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input) return "";
  return String(input)
    .trim()
    .slice(0, maxLength)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Send email via Brevo SMTP using raw TCP
async function sendEmailViaSMTP(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }
    
    // Use Brevo's REST API
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
      return { success: false, error: `Brevo API error: ${response.status}` };
    }

    const result = await response.json();
    console.log("Email sent successfully via Brevo:", result);
    return { success: true };
  } catch (error: any) {
    console.error("SMTP send error:", error);
    return { success: false, error: error.message };
  }
}

// UniVoid branded HTML email template
function getEmailTemplate(title: string, content: string, ctaButton?: { text: string; url: string }): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f5;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header with Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    ✨ UniVoid
                  </h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">
                    Where students learn, share, and grow together
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 32px;">
                  <h2 style="color: #1a1a1a; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">
                    ${title}
                  </h2>
                  ${content}
                  
                  ${ctaButton ? `
                  <div style="text-align: center; margin-top: 32px;">
                    <a href="${ctaButton.url}" 
                       style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                      ${ctaButton.text}
                    </a>
                  </div>
                  ` : ''}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 24px 32px; text-align: center;">
                  <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;">
                    © ${new Date().getFullYear()} UniVoid. All rights reserved.
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    <a href="https://univoid.tech" style="color: #666666; text-decoration: none;">univoid.tech</a>
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

// Generate email content based on type
function generateEmailContent(type: EmailType, data: Record<string, unknown>): { subject: string; html: string } {
  switch (type) {
    case "login_notification": {
      const userName = sanitizeInput(data.userName as string || "User", 100);
      const loginTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const content = `
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Hi ${userName},
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          You've successfully logged in to your UniVoid account.
        </p>
        <div style="background-color: #f8f8f8; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="color: #666666; font-size: 14px; padding: 4px 0;">Login Time:</td>
              <td style="color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${loginTime}</td>
            </tr>
          </table>
        </div>
        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
          If this wasn't you, please secure your account immediately by changing your password.
        </p>
      `;
      return {
        subject: "🔐 Login Activity on UniVoid",
        html: getEmailTemplate("Login Successful", content, { text: "Go to Dashboard", url: "https://univoid.tech/dashboard" })
      };
    }

    case "event_created": {
      const eventName = sanitizeInput(data.eventName as string, 200);
      const eventDate = sanitizeInput(data.eventDate as string, 100);
      const eventId = sanitizeInput(data.eventId as string, 100);
      const organizerName = sanitizeInput(data.organizerName as string || "Organizer", 100);
      const content = `
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Hi ${organizerName},
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          🎉 Your event has been created successfully on UniVoid!
        </p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 18px;">Event Details</h3>
          <table style="width: 100%;">
            <tr>
              <td style="color: #666666; font-size: 14px; padding: 4px 0;">Event Name:</td>
              <td style="color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${eventName}</td>
            </tr>
            <tr>
              <td style="color: #666666; font-size: 14px; padding: 4px 0;">Date:</td>
              <td style="color: #1a1a1a; font-size: 14px; text-align: right;">${eventDate}</td>
            </tr>
          </table>
        </div>
        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
          You can manage registrations and track analytics from your Organizer Dashboard.
        </p>
      `;
      return {
        subject: `✅ Event Created: ${eventName}`,
        html: getEmailTemplate("Event Created Successfully", content, { text: "View Event Dashboard", url: `https://univoid.tech/organizer/dashboard` })
      };
    }

    case "event_registration": {
      const userName = sanitizeInput(data.userName as string || "Participant", 100);
      const eventName = sanitizeInput(data.eventName as string, 200);
      const eventDate = sanitizeInput(data.eventDate as string, 100);
      const eventLocation = sanitizeInput(data.eventLocation as string || "TBA", 200);
      const isPaid = data.isPaid as boolean;
      const content = `
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Hi ${userName},
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          ${isPaid 
            ? "Your registration has been submitted! We've received your payment screenshot and it's pending verification."
            : "🎉 Great news! Your registration has been confirmed."}
        </p>
        <div style="background-color: #f8f8f8; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px;">Event Details</h3>
          <table style="width: 100%;">
            <tr>
              <td style="color: #666666; font-size: 14px; padding: 8px 0;">Event:</td>
              <td style="color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${eventName}</td>
            </tr>
            <tr>
              <td style="color: #666666; font-size: 14px; padding: 8px 0;">Date:</td>
              <td style="color: #1a1a1a; font-size: 14px; text-align: right;">${eventDate}</td>
            </tr>
            <tr>
              <td style="color: #666666; font-size: 14px; padding: 8px 0;">Location:</td>
              <td style="color: #1a1a1a; font-size: 14px; text-align: right;">${eventLocation}</td>
            </tr>
          </table>
        </div>
        ${isPaid ? `
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            ⏳ <strong>Payment Pending:</strong> Your registration will be confirmed once the organizer verifies your payment.
          </p>
        </div>
        ` : `
        <div style="background-color: #d1fae5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #065f46; margin: 0; font-size: 14px;">
            ✅ <strong>Confirmed:</strong> Your ticket has been generated! Check your tickets in the app.
          </p>
        </div>
        `}
      `;
      return {
        subject: isPaid ? `📝 Registration Submitted: ${eventName}` : `🎉 You're Registered: ${eventName}`,
        html: getEmailTemplate("Registration Confirmation", content, { text: "View My Events", url: "https://univoid.tech/my-tickets" })
      };
    }

    case "partner_request":
    case "area_request": {
      const senderName = sanitizeInput(data.senderName as string, 100);
      const senderEmail = sanitizeInput(data.senderEmail as string, 150);
      const requestType = type === "partner_request" ? "Project Partner" : "Area";
      const projectName = sanitizeInput(data.projectName as string || "", 200);
      const message = sanitizeInput(data.message as string || "", 2000);
      const recipientName = sanitizeInput(data.recipientName as string || "User", 100);
      
      const content = `
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Hi ${recipientName},
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          You've received a new ${requestType} request on UniVoid!
        </p>
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 18px;">Request Details</h3>
          <table style="width: 100%;">
            <tr>
              <td style="color: #666666; font-size: 14px; padding: 4px 0;">From:</td>
              <td style="color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right;">${senderName}</td>
            </tr>
            <tr>
              <td style="color: #666666; font-size: 14px; padding: 4px 0;">Type:</td>
              <td style="color: #1a1a1a; font-size: 14px; text-align: right;">${requestType} Request</td>
            </tr>
            ${projectName ? `
            <tr>
              <td style="color: #666666; font-size: 14px; padding: 4px 0;">Project:</td>
              <td style="color: #1a1a1a; font-size: 14px; text-align: right;">${projectName}</td>
            </tr>
            ` : ''}
          </table>
          ${message ? `
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #dbeafe;">
            <p style="color: #666666; font-size: 12px; margin: 0 0 8px 0;">Message:</p>
            <p style="color: #333333; font-size: 14px; margin: 0; font-style: italic;">"${message}"</p>
          </div>
          ` : ''}
        </div>
        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
          Visit your dashboard to respond to this request.
        </p>
      `;
      return {
        subject: `🤝 New ${requestType} Request from ${senderName}`,
        html: getEmailTemplate(`${requestType} Request`, content, { text: "View Request", url: "https://univoid.tech/dashboard" })
      };
    }

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Validate API key
    if (!BREVO_API_KEY) {
      console.error("BREVO_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const { type, recipientEmail, recipientName, data }: EmailRequest = await req.json();

    if (!type || !recipientEmail) {
      throw new Error("Missing required fields: type and recipientEmail");
    }

    console.log(`Processing ${type} email for ${recipientEmail}`);

    // Add recipient name to data if provided
    if (recipientName) {
      data.recipientName = recipientName;
      data.userName = recipientName;
    }

    // Generate email content
    const { subject, html } = generateEmailContent(type, data);

    // Send email via Brevo
    const result = await sendEmailViaSMTP(recipientEmail, subject, html);

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    console.log(`Email sent successfully: ${type} to ${recipientEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-brevo-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
