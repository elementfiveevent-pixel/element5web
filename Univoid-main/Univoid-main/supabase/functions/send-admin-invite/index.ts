import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface InviteRequest {
  email: string;
  invitedBy: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, invitedBy }: InviteRequest = await req.json();

    if (!email || !invitedBy) {
      return new Response(
        JSON.stringify({ error: "Email and invitedBy are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if invite already exists
    const { data: existingInvite } = await supabase
      .from("admin_invites")
      .select("id, status")
      .eq("email", normalizedEmail)
      .single();

    if (existingInvite) {
      if (existingInvite.status === "accepted") {
        return new Response(
          JSON.stringify({ error: "This email has already been invited and accepted" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Update existing pending invite
      await supabase
        .from("admin_invites")
        .update({
          invited_by: invitedBy,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
        })
        .eq("id", existingInvite.id);

      console.log("Updated existing invite for:", normalizedEmail);
    } else {
      // Create new invite
      const { error: insertError } = await supabase
        .from("admin_invites")
        .insert({
          email: normalizedEmail,
          invited_by: invitedBy,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
      console.log("Created new invite for:", normalizedEmail);
    }

    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", invitedBy)
      .single();

    const inviterName = inviterProfile?.full_name || "An admin";
    const loginUrl = "https://univoid.tech";

    // Send invite email if RESEND_API_KEY exists
    if (!RESEND_API_KEY) {
      console.log("No RESEND_API_KEY configured - skipping email, but invite created");
      return new Response(
        JSON.stringify({ success: true, message: "Invite created (email skipped - no API key)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi there,
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${inviterName}</strong> has invited you to become an <strong>Admin Assistant</strong> on UniVoid!
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            As an Admin Assistant, you'll be able to:
          </p>
          
          <ul style="font-size: 14px; margin-bottom: 25px; padding-left: 20px;">
            <li>Review and approve study materials</li>
            <li>Moderate news submissions</li>
            <li>Help manage content on the platform</li>
            <li>Support the admin team</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Sign in with Google to Accept
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 25px;">
            Simply sign in with Google using this email address, and your Admin Assistant role will be automatically assigned.
          </p>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
            This invitation expires in 7 days.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>UniVoid - Student Resource Platform</p>
        </div>
      </body>
      </html>
    `;

    console.log("=== RESEND EMAIL ATTEMPT ===");
    console.log("To:", normalizedEmail);
    console.log("API Key exists:", !!RESEND_API_KEY);
    console.log("API Key prefix:", RESEND_API_KEY?.substring(0, 10) + "...");

    const emailPayload = {
      from: "UniVoid <onboarding@resend.dev>",
      to: [normalizedEmail],
      subject: "You've been invited as an Admin Assistant on UniVoid",
      html: emailHtml,
    };
    console.log("Email payload (without html):", { ...emailPayload, html: "[HTML CONTENT]" });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await res.text();
    console.log("Resend response status:", res.status);
    console.log("Resend response body:", responseText);

    if (!res.ok) {
      console.error("❌ RESEND API ERROR:", responseText);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invite created but email failed",
          emailError: responseText
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailData = JSON.parse(responseText);
    console.log("✅ Admin invite email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "Invite sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending admin invite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
