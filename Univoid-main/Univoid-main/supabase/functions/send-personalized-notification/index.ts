import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface ResendEmail {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

async function sendResendEmail(apiKey: string, email: ResendEmail) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(email),
  });
  return response.json();
}

interface NotificationRequest {
  type: 'scholarship' | 'material' | 'event' | 'system';
  action: 'created' | 'approved' | 'updated' | 'deadline';
  data: {
    id: string;
    title: string;
    description?: string;
    states?: string[];
    courses?: string[];
    is_all_india?: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, action, data }: NotificationRequest = await req.json();
    console.log(`Processing ${action} notification for ${type}:`, data.title);

    // Build notification content based on type
    let notificationTitle = "";
    let notificationMessage = "";
    let notificationLink = "";
    let emailSubject = "";

    switch (type) {
      case "scholarship":
        notificationTitle = action === "approved"
          ? "🎓 New Scholarship Available!"
          : action === "deadline"
            ? "⏰ Scholarship Deadline Alert"
            : "📚 Scholarship Update";
        notificationMessage = data.title;
        notificationLink = "/scholarships";
        emailSubject = `New Scholarship: ${data.title}`;
        break;
      case "material":
        notificationTitle = action === "approved"
          ? "📄 New Study Material!"
          : "📄 Material Update";
        notificationMessage = data.title;
        notificationLink = "/materials";
        emailSubject = `New Material: ${data.title}`;
        break;
      case "event":
        notificationTitle = action === "approved"
          ? "🎉 New Event Published!"
          : "📅 Event Update";
        notificationMessage = data.title;
        notificationLink = `/events/${data.id}`;
        emailSubject = `New Event: ${data.title}`;
        break;
      default:
        notificationTitle = "📢 Update";
        notificationMessage = data.title;
        notificationLink = "/";
        emailSubject = `Update: ${data.title}`;
    }

    // Get eligible users based on personalization
    let eligibleUsers: { id: string; email: string; full_name: string; state: string | null }[] = [];

    if (type === "scholarship" && data.states && !data.is_all_india) {
      // State-wise personalization for scholarships
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, state")
        .eq("is_disabled", false)
        .in("state", data.states);

      if (!error && users) {
        eligibleUsers = users;
      }
    } else {
      // All users for general notifications or All India scholarships
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, state")
        .eq("is_disabled", false)
        .limit(1000); // Max 1000 users per batch

      if (!error && users) {
        eligibleUsers = users;
      }
    }

    console.log(`Found ${eligibleUsers.length} eligible users`);

    // Create in-app notifications in batch
    const notifications = eligibleUsers.map(user => ({
      user_id: user.id,
      title: notificationTitle,
      message: notificationMessage,
      type: type,
      link: notificationLink,
      is_read: false,
    }));

    if (notifications.length > 0) {
      // Insert in batches of 100
      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        const { error } = await supabase.from("notifications").insert(batch);
        if (error) {
          console.error("Error inserting notifications batch:", error);
        }
      }
      console.log(`Created ${notifications.length} in-app notifications`);
    }

    // Send Web Push notifications
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (vapidPublicKey && vapidPrivateKey) {
      // Get push subscriptions for eligible users
      const userIds = eligibleUsers.map(u => u.id);
      const { data: pushSubs } = await supabase
        .from("push_subscriptions")
        .select("user_id, endpoint, p256dh, auth")
        .in("user_id", userIds);

      if (pushSubs && pushSubs.length > 0) {
        console.log(`Sending push notifications to ${pushSubs.length} subscribers`);

        let pushSent = 0;
        for (const sub of pushSubs) {
          try {
            // Simple fetch to push endpoint (browser will handle the encryption)
            const response = await fetch(sub.endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'TTL': '86400',
              },
              body: JSON.stringify({
                title: notificationTitle,
                message: notificationMessage,
                link: notificationLink,
                icon: '/favicon.png',
              }),
            });

            if (response.ok || response.status === 201) {
              pushSent++;
            } else if (response.status === 410 || response.status === 404) {
              // Subscription expired, remove it
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("user_id", sub.user_id);
            }
          } catch (pushError) {
            console.error(`Push failed for user ${sub.user_id}:`, pushError);
          }
        }
        console.log(`Sent ${pushSent} push notifications`);
      }
    }

    // Get users with email preferences enabled
    if (resendApiKey && (type === "scholarship" || type === "event")) {
      const preferenceColumn = type === "scholarship" ? "scholarship_alerts" : "event_alerts";

      const { data: emailPrefs } = await supabase
        .from("email_preferences")
        .select("user_id")
        .eq(preferenceColumn, true);

      const emailEnabledUserIds = new Set(emailPrefs?.map(p => p.user_id) || []);
      const emailUsers = eligibleUsers.filter(u => emailEnabledUserIds.has(u.id));

      // Send emails in batches (max 50 per batch to avoid rate limits)
      let emailsSent = 0;
      for (let i = 0; i < emailUsers.length; i += 50) {
        const batch = emailUsers.slice(i, i + 50);

        for (const user of batch) {
          try {
            await sendResendEmail(resendApiKey, {
              from: "UniVoid <notifications@univoid.in>",
              to: [user.email],
              subject: emailSubject,
              html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 16px 16px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">${notificationTitle}</h1>
                  </div>
                  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
                    <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">
                      Hi ${user.full_name},
                    </p>
                    <h2 style="color: #1e293b; margin-bottom: 15px;">${data.title}</h2>
                    ${data.description ? `<p style="color: #64748b; margin-bottom: 20px;">${data.description}</p>` : ''}
                    <a href="https://univoid.in${notificationLink}" 
                       style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                      View Details →
                    </a>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
                    You're receiving this because you enabled ${type} alerts. 
                    <a href="https://univoid.in/edit-profile" style="color: #6366f1;">Manage preferences</a>
                  </p>
                </div>
              `,
            });
            emailsSent++;
          } catch (emailError) {
            console.error(`Failed to send email to ${user.email}:`, emailError);
          }
        }

        // Small delay between batches
        if (i + 50 < emailUsers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Sent ${emailsSent} emails`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notifications.length,
        type,
        action
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error: any) {
    console.error("Error in send-personalized-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
