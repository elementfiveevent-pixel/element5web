import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface NotifyRequest {
  materialId: string;
  title: string;
  uploaderName: string;
  contentType: 'material' | 'news' | 'book';
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

    const { materialId, title, uploaderName, contentType = 'material' }: NotifyRequest = await req.json();

    console.log(`New ${contentType} submitted for review:`, { materialId, title, uploaderName });

    if (!RESEND_API_KEY) {
      console.log("No RESEND_API_KEY configured - skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "Notification skipped - no API key" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all admins and admin assistants
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "admin_assistant"]);

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admins or assistants to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin emails
    const adminIds = adminRoles.map((r: any) => r.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("id", adminIds);

    if (profilesError || !profiles || profiles.length === 0) {
      console.log("No admin profiles found");
      return new Response(
        JSON.stringify({ success: true, message: "No admin emails found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminEmails = profiles.map((p: any) => p.email).filter(Boolean);
    console.log(`Sending notification to ${adminEmails.length} admins`);

    const contentTypeLabel = contentType === 'material' ? 'Study Material' :
      contentType === 'news' ? 'News Article' : 'Book Listing';
    const reviewUrl = "https://univoid.tech/admin";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📋 New Content Pending Review</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 25px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            A new <strong>${contentTypeLabel}</strong> has been submitted and requires your review.
          </p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Title:</p>
            <p style="margin: 0; font-size: 16px; font-weight: 600;">${title}</p>
            
            <p style="margin: 15px 0 8px 0; font-size: 14px; color: #666;">Uploaded by:</p>
            <p style="margin: 0; font-size: 16px;">${uploaderName}</p>
            
            <p style="margin: 15px 0 8px 0; font-size: 14px; color: #666;">Content Type:</p>
            <p style="margin: 0; font-size: 16px;">${contentTypeLabel}</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${reviewUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Review Now
            </a>
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
            Please review and approve or reject this content promptly.
          </p>
        </div>
        
        <div style="text-align: center; padding: 15px; color: #999; font-size: 12px;">
          <p>UniVoid Admin Notification</p>
        </div>
      </body>
      </html>
    `;

    // Send email to all admins
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "UniVoid <onboarding@resend.dev>",
        to: adminEmails,
        subject: `[Review Required] New ${contentTypeLabel}: ${title}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      // Don't throw - just log, we don't want to fail the upload
      return new Response(
        JSON.stringify({ success: true, message: "Content saved, email notification failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailData = await res.json();
    console.log("Review notification sent:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: `Notification sent to ${adminEmails.length} admins` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending review notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Return success anyway - don't block upload due to email failure
    return new Response(
      JSON.stringify({ success: true, message: "Content saved, notification error: " + errorMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
