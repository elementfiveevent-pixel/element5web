import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface StatusEmailRequest {
  userId: string;
  materialTitle: string;
  status: "approved" | "rejected";
  contentType: "materials" | "news" | "books";
}

serve(async (req) => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, materialTitle, status, contentType }: StatusEmailRequest = await req.json();

    if (!userId || !materialTitle || !status || !contentType) {
      console.error("Missing required fields:", { userId, materialTitle, status, contentType });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's email and name
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Profile not found:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userName = profile.full_name || "User";
    const userEmail = profile.email;

    console.log(`Sending ${status} email to ${userEmail} for ${contentType}: ${materialTitle}`);

    if (!RESEND_API_KEY) {
      console.log("No RESEND_API_KEY configured - skipping email");
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped - no API key" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentTypeLabel = contentType === "materials" ? "study material" : contentType === "news" ? "news article" : "book listing";
    const isApproved = status === "approved";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${isApproved ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${isApproved ? '✅ Content Approved!' : '❌ Content Not Approved'}</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${userName},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Your ${contentTypeLabel} <strong>"${materialTitle}"</strong> has been <strong>${isApproved ? 'approved' : 'rejected'}</strong> by our moderation team.
          </p>
          
          ${isApproved ? `
            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                🎉 Your content is now live on UniVoid! You've also earned XP for your contribution.
              </p>
            </div>
          ` : `
            <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                Your submission didn't meet our guidelines. Please review our content policy and try again.
              </p>
            </div>
          `}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://univoid.tech/dashboard" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              View Dashboard
            </a>
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
            Thank you for contributing to UniVoid!
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>UniVoid - Student Resource Platform</p>
        </div>
      </body>
      </html>
    `;

    console.log("=== RESEND EMAIL ATTEMPT ===");
    console.log("To:", userEmail);
    console.log("API Key exists:", !!RESEND_API_KEY);
    console.log("API Key prefix:", RESEND_API_KEY?.substring(0, 10) + "...");

    const emailPayload = {
      from: "UniVoid <onboarding@resend.dev>",
      to: [userEmail],
      subject: isApproved
        ? `✅ Your ${contentTypeLabel} has been approved!`
        : `Update on your ${contentTypeLabel} submission`,
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
          message: "Status updated but email failed",
          emailError: responseText
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailData = JSON.parse(responseText);
    console.log("✅ Status email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending status email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
