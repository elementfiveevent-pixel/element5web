import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface VolunteerNotificationRequest {
  type: "application_received" | "approved" | "rejected" | "invite" | "invite_accepted" | "invite_rejected";
  assignmentId?: string;
  roleId?: string;
  userId?: string;
  organizerEmail?: string;
  // For invite type
  eventId?: string;
  eventTitle?: string;
  organizerName?: string;
  role?: string;
  // For invite response types
  organizerId?: string;
  volunteerName?: string;
  volunteerRole?: string;
}

serve(async (req) => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, roleId, userId, organizerEmail, eventId, eventTitle, organizerName, role: inviteRole, organizerId, volunteerName, volunteerRole }: VolunteerNotificationRequest = await req.json();

    let emailResponse;

    // Handle invite accepted/rejected notifications to organizer
    if (type === "invite_accepted" || type === "invite_rejected") {
      console.log(`Sending ${type} notification to organizer:`, organizerId);

      if (!organizerId) {
        throw new Error("organizerId is required for invite response notifications");
      }

      // Fetch organizer email
      const { data: organizerProfile, error: orgError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", organizerId)
        .single();

      if (orgError || !organizerProfile) {
        throw new Error("Organizer not found");
      }

      const roleLabels: Record<string, string> = {
        entry: "Entry Management",
        qr_checkin: "QR Check-in",
        help_desk: "Help Desk",
        all: "All Roles",
      };
      const roleName = roleLabels[volunteerRole || "all"] || volunteerRole || "Volunteer";
      const isAccepted = type === "invite_accepted";

      emailResponse = await resend.emails.send({
        from: "Univoid <notifications@univoid.in>",
        to: [organizerProfile.email],
        subject: isAccepted
          ? `✅ Volunteer Accepted - ${eventTitle}`
          : `❌ Volunteer Declined - ${eventTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, ${isAccepted ? '#22c55e, #16a34a' : '#f97316, #ea580c'}); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">
                  ${isAccepted ? '🎉 Volunteer Accepted!' : '📋 Invite Declined'}
                </h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Hi ${organizerProfile.full_name},
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  ${isAccepted
            ? `<strong>${volunteerName}</strong> has <strong style="color: #22c55e;">accepted</strong> your volunteer invitation!`
            : `<strong>${volunteerName}</strong> has <strong style="color: #f97316;">declined</strong> your volunteer invitation.`
          }
                </p>
                
                <div style="background: ${isAccepted ? '#f0fdf4' : '#fff7ed'}; border: 1px solid ${isAccepted ? '#22c55e' : '#f97316'}; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>📅 Event:</strong> ${eventTitle}</p>
                  <p style="margin: 0;"><strong>👤 Role:</strong> ${roleName}</p>
                </div>

                ${isAccepted
            ? `<p style="color: #666; font-size: 14px;">
                      They now have access to the volunteer dashboard and can help with check-ins. 
                      You can manage volunteers from your organizer dashboard.
                    </p>`
            : `<p style="color: #666; font-size: 14px;">
                      You may want to invite another volunteer for this role.
                    </p>`
          }

                <a href="https://univoid.in/organizer" 
                   style="display: inline-block; background: ${isAccepted ? '#22c55e' : '#7c3aed'}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px;">
                  View Volunteers
                </a>
              </div>
              <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Univoid. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("Organizer notification sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, emailResponse }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For user-targeted notifications, fetch user profile
    let userProfile = null;
    if (userId) {
      const { data, error: userError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      if (userError || !data) {
        throw new Error("User not found");
      }
      userProfile = data;
    }

    // Handle invite notification (new invite system)
    if (type === "invite") {
      if (!userProfile) {
        throw new Error("User profile required for invite notification");
      }
      console.log("Sending volunteer invite email to:", userProfile.email);

      const roleLabels: Record<string, string> = {
        entry: "Entry Management",
        qr_checkin: "QR Check-in",
        help_desk: "Help Desk",
        all: "All Roles",
      };
      const roleName = roleLabels[inviteRole || "all"] || inviteRole || "Volunteer";

      emailResponse = await resend.emails.send({
        from: "Univoid <notifications@univoid.in>",
        to: [userProfile.email],
        subject: `🎉 You're invited to volunteer - ${eventTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #7c3aed, #6366f1); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🙌 You're Invited!</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Hi ${userProfile.full_name},
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  <strong>${organizerName || "An organizer"}</strong> has invited you to be a volunteer for their event!
                </p>
                
                <div style="background: #f0f4ff; border: 1px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>📅 Event:</strong> ${eventTitle}</p>
                  <p style="margin: 0;"><strong>👤 Role:</strong> ${roleName}</p>
                </div>

                <p style="color: #666; font-size: 14px;">
                  Log in to your dashboard to <strong>Accept</strong> or <strong>Decline</strong> this invitation.
                </p>

                <a href="https://univoid.in/dashboard?tab=volunteer-invites&event=${eventId}" 
                   style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px;">
                  View Invitation
                </a>
              </div>
              <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Univoid. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("Volunteer invite email sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, emailResponse }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For other types, fetch role details
    if (!roleId) {
      throw new Error("roleId is required for this notification type");
    }

    // Fetch role details
    const { data: role, error: roleError } = await supabase
      .from("volunteer_roles")
      .select(`
        title,
        description,
        perks,
        event:events(title, organizer_id)
      `)
      .eq("id", roleId)
      .single();

    if (roleError || !role) {
      throw new Error("Role not found");
    }

    // deno-lint-ignore no-explicit-any
    const eventData = role.event as any;
    const roleEventTitle = eventData?.title || "Event";
    const eventOrganizerId = eventData?.organizer_id;

    // Ensure userProfile is available for notification types that need it
    if (!userProfile) {
      throw new Error("User profile is required for this notification type");
    }

    if (type === "application_received") {
      // Notify organizer about new application
      let targetEmail = organizerEmail;

      if (!targetEmail && eventOrganizerId) {
        const { data: organizerProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", eventOrganizerId)
          .single();
        targetEmail = organizerProfile?.email;
      }

      if (targetEmail) {
        emailResponse = await resend.emails.send({
          from: "Univoid <notifications@univoid.in>",
          to: [targetEmail],
          subject: `New Volunteer Application - ${role.title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #7c3aed, #6366f1); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🙋 New Volunteer Application</h1>
                </div>
                <div style="padding: 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Someone has applied to volunteer for your event!
                  </p>
                  
                  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;"><strong>Event:</strong> ${roleEventTitle}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Role:</strong> ${role.title}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Applicant:</strong> ${userProfile.full_name}</p>
                    <p style="margin: 0;"><strong>Email:</strong> ${userProfile.email}</p>
                  </div>

                  <p style="color: #666; font-size: 14px;">
                    Visit your Organizer Dashboard to review and approve/reject this application.
                  </p>

                  <a href="https://univoid.in/organizer" 
                     style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px;">
                    Review Application
                  </a>
                </div>
                <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Univoid. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      }
    } else if (type === "approved") {
      // Notify volunteer they've been approved
      emailResponse = await resend.emails.send({
        from: "Univoid <notifications@univoid.in>",
        to: [userProfile.email],
        subject: `🎉 You're approved as a volunteer - ${roleEventTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">✅ You're In!</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Hi ${userProfile.full_name},
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Great news! Your volunteer application has been <strong style="color: #22c55e;">approved</strong>!
                </p>
                
                <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>Event:</strong> ${roleEventTitle}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Your Role:</strong> ${role.title}</p>
                  ${role.description ? `<p style="margin: 0 0 10px 0;"><strong>Description:</strong> ${role.description}</p>` : ""}
                  ${role.perks ? `<p style="margin: 0;"><strong>🎁 Perks:</strong> ${role.perks}</p>` : ""}
                </div>

                <p style="color: #666; font-size: 14px;">
                  The organizer will reach out with more details about your responsibilities. 
                  Thank you for volunteering!
                </p>

                <a href="https://univoid.in/dashboard" 
                   style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px;">
                  View My Dashboard
                </a>
              </div>
              <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Univoid. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      // Create notification in database
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "volunteer",
        title: "Volunteer Application Approved! 🎉",
        message: `You've been approved as a volunteer for "${role.title}" at ${roleEventTitle}.`,
        link: "/dashboard",
      });

    } else if (type === "rejected") {
      // Notify volunteer they've been rejected
      emailResponse = await resend.emails.send({
        from: "Univoid <notifications@univoid.in>",
        to: [userProfile.email],
        subject: `Volunteer Application Update - ${roleEventTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Hi ${userProfile.full_name},
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Thank you for your interest in volunteering for <strong>${roleEventTitle}</strong>.
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Unfortunately, we were unable to accept your application for the <strong>${role.title}</strong> role at this time. 
                  This could be due to limited slots or specific requirements for this position.
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  We encourage you to explore other volunteer opportunities on Univoid. 
                  There are many ways to get involved!
                </p>

                <a href="https://univoid.in/events" 
                   style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px;">
                  Browse Events
                </a>
              </div>
              <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Univoid. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      // Create notification in database
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "volunteer",
        title: "Volunteer Application Update",
        message: `Your application for "${role.title}" at ${roleEventTitle} was not accepted.`,
        link: "/events",
      });
    }

    console.log("Volunteer notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error sending volunteer notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
