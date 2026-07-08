import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@univoid.in";
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "UniVoid <no-reply@univoid.in>";

interface ContactEmailPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

// Basic input sanitization
function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input) return "";
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  // Rate Limiting
  const { allowRequest } = await import("../_shared/rateLimiter.ts");
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!allowRequest(ip, 2, 20)) { // Strict limit for contact form: 2 req/s, burst 20
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: ContactEmailPayload = await req.json();

    // Validate required fields
    if (!payload.name || !payload.email || !payload.message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const name = sanitizeInput(payload.name, 100);
    const email = sanitizeInput(payload.email, 255);
    const subject = sanitizeInput(payload.subject || "General Inquiry", 200);
    const message = sanitizeInput(payload.message, 2000);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #666; }
            .value { margin-top: 5px; }
            .message { background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #4F46E5; white-space: pre-wrap; }
            .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Contact Message - UniVoid</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">From:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${subject}</div>
              </div>
              <div class="field">
                <div class="label">Received at:</div>
                <div class="value">${timestamp}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div class="message">${message.replace(/\n/g, "<br>")}</div>
              </div>
            </div>
            <div class="footer">
              This message was sent via the UniVoid Contact Form
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Sending email to:", ADMIN_EMAIL);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `[UniVoid Contact] ${subject} - from ${name}`,
        html: emailHtml,
        reply_to: email,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-contact-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});