import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface Scholarship {
  id: string;
  title: string;
  description: string;
  deadline: string;
  eligible_states: string[];
  is_all_india: boolean;
  eligible_courses: string[];
  application_link: string | null;
  source_name: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  state: string | null;
  course_stream: string | null;
  degree: string | null;
}

function getUserCourseLevel(profile: UserProfile): string {
  const degree = (profile.degree || profile.course_stream || "").toLowerCase();
  if (degree.includes("phd") || degree.includes("master") || degree.includes("m.tech") ||
    degree.includes("mba") || degree.includes("msc") || degree.includes("pg")) {
    return "PG";
  }
  if (degree.includes("diploma") || degree.includes("polytechnic") || degree.includes("iti")) {
    return "Diploma";
  }
  return "UG";
}

function isEligible(scholarship: Scholarship, profile: UserProfile): boolean {
  const stateMatch = scholarship.is_all_india ||
    (profile.state && scholarship.eligible_states.some(s =>
      s.toLowerCase() === profile.state?.toLowerCase()
    ));

  if (!stateMatch) return false;

  if (scholarship.eligible_courses.length > 0 && !scholarship.eligible_courses.includes("Any")) {
    const userLevel = getUserCourseLevel(profile);
    if (!scholarship.eligible_courses.includes(userLevel)) {
      return false;
    }
  }

  return true;
}

function formatDate(deadline: string): string {
  return new Date(deadline).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    console.log("Starting deadline reminder job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    const format = (d: Date) => d.toISOString().split('T')[0];

    // Get scholarships with deadlines in 3 or 7 days
    const { data: scholarships, error: schError } = await supabase
      .from("scholarships")
      .select("id, title, description, deadline, eligible_states, is_all_india, eligible_courses, application_link, source_name")
      .eq("status", "approved")
      .eq("deadline_status", "active")
      .or(`deadline.eq.${format(in3Days)},deadline.eq.${format(in7Days)}`);

    if (schError) throw schError;

    if (!scholarships || scholarships.length === 0) {
      console.log("No scholarships with upcoming deadlines");
      return new Response(
        JSON.stringify({ success: true, message: "No upcoming deadlines", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const scholarships3Days = (scholarships as Scholarship[]).filter(s =>
      s.deadline === format(in3Days)
    );
    const scholarships7Days = (scholarships as Scholarship[]).filter(s =>
      s.deadline === format(in7Days)
    );

    console.log(`Found ${scholarships3Days.length} with 3-day deadline, ${scholarships7Days.length} with 7-day deadline`);

    // Get users who want scholarship alerts
    const { data: preferences, error: prefError } = await supabase
      .from("email_preferences")
      .select("user_id")
      .eq("scholarship_alerts", true);

    if (prefError) throw prefError;

    const userIds = preferences?.map(p => p.user_id) || [];

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users subscribed", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, state, course_stream, degree")
      .in("id", userIds)
      .eq("is_disabled", false);

    if (profileError) throw profileError;

    let emailsSent = 0;
    let notificationsSent = 0;

    for (const profile of (profiles || []) as UserProfile[]) {
      // Filter eligible scholarships
      const eligible3Days = scholarships3Days.filter(s => isEligible(s, profile));
      const eligible7Days = scholarships7Days.filter(s => isEligible(s, profile));

      const allEligible = [...eligible3Days, ...eligible7Days];

      if (allEligible.length === 0) continue;

      // Create in-app notification for urgent ones (3 days)
      for (const scholarship of eligible3Days) {
        await supabase.from("notifications").insert({
          user_id: profile.id,
          title: "⏰ Scholarship Deadline in 3 Days!",
          message: `${scholarship.title} deadline: ${formatDate(scholarship.deadline)}`,
          type: "deadline_urgent",
          link: `/scholarships?id=${scholarship.id}`,
        });
        notificationsSent++;
      }

      // Send email
      try {
        const urgentHtml = eligible3Days.length > 0 ? `
          <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin: 0 0 15px 0; font-size: 18px;">🔥 Deadline in 3 DAYS!</h2>
            ${eligible3Days.map(s => `
              <div style="margin-bottom: 15px; padding: 12px; background: white; border-radius: 8px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${s.title}</h3>
                <p style="margin: 0 0 8px 0; color: #dc2626; font-weight: bold;">⏰ Deadline: ${formatDate(s.deadline)}</p>
                ${s.application_link ? `<a href="${s.application_link}" style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Apply NOW →</a>` : ''}
              </div>
            `).join('')}
          </div>
        ` : '';

        const weekHtml = eligible7Days.length > 0 ? `
          <div style="background: #fefce8; border: 2px solid #eab308; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #ca8a04; margin: 0 0 15px 0; font-size: 18px;">⏳ Deadline in 7 Days</h2>
            ${eligible7Days.map(s => `
              <div style="margin-bottom: 15px; padding: 12px; background: white; border-radius: 8px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${s.title}</h3>
                <p style="margin: 0 0 8px 0; color: #ca8a04; font-weight: bold;">📅 Deadline: ${formatDate(s.deadline)}</p>
                ${s.application_link ? `<a href="${s.application_link}" style="display: inline-block; background: #eab308; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500;">Apply →</a>` : ''}
              </div>
            `).join('')}
          </div>
        ` : '';

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1f2937; font-size: 24px; margin: 0;">⏰ Scholarship Deadline Reminder</h1>
                <p style="color: #6b7280; margin: 10px 0 0 0;">Don't miss these opportunities!</p>
              </div>
              
              <p style="color: #1f2937; font-size: 16px;">Hi ${profile.full_name || 'Student'},</p>
              <p style="color: #6b7280; font-size: 14px;">The following scholarships that match your profile have upcoming deadlines:</p>
              
              ${urgentHtml}
              ${weekHtml}
              
              <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px; text-align: center;">
                <a href="https://univoid.in/scholarships" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                  View All Scholarships
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                You're receiving this because you enabled scholarship alerts on UniVoid.<br>
                <a href="https://univoid.in/dashboard" style="color: #10b981;">Manage preferences</a>
              </p>
            </div>
          </body>
          </html>
        `;

        const urgentCount = eligible3Days.length;
        const subject = urgentCount > 0
          ? `🔥 ${urgentCount} Scholarship${urgentCount > 1 ? 's' : ''} Deadline in 3 DAYS!`
          : `⏳ ${eligible7Days.length} Scholarship Deadline in 7 Days`;

        const { error: emailError } = await resend.emails.send({
          from: "UniVoid <notifications@resend.dev>",
          to: [profile.email],
          subject,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to send to ${profile.email}:`, emailError);
        } else {
          emailsSent++;
          console.log(`Sent deadline reminder to ${profile.email}`);
        }
      } catch (userError) {
        console.error(`Error for user ${profile.id}:`, userError);
      }
    }

    console.log(`Completed: ${emailsSent} emails, ${notificationsSent} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        scholarships3Days: scholarships3Days.length,
        scholarships7Days: scholarships7Days.length,
        emailsSent,
        notificationsSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Deadline reminder error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
