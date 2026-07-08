import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface Event {
  id: string;
  title: string;
  category: string;
  venue_address: string | null;
  venue_name: string | null;
}

interface UserProfile {
  id: string;
  interests: string[] | null;
  city: string | null;
  state: string | null;
}

interface EmailPreference {
  user_id: string;
  interest_based_alerts: boolean;
  location_based_alerts: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body - either specific event_id or process recent events
    const body = await req.json().catch(() => ({}));
    const { event_id } = body;

    console.log('Starting notification generation...', { event_id });

    // Fetch events to process
    let eventsQuery = supabase
      .from('events')
      .select('id, title, category, venue_address, venue_name')
      .eq('status', 'published');

    if (event_id) {
      // Process specific event
      eventsQuery = eventsQuery.eq('id', event_id);
    } else {
      // Process events created in last hour (for cron job)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      eventsQuery = eventsQuery.gte('created_at', oneHourAgo);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    if (!events || events.length === 0) {
      console.log('No events to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No events to process', notifications_created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${events.length} event(s)`);

    // Fetch all user profiles with interests or location
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, interests, city, state')
      .eq('is_disabled', false);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Fetch email preferences for users who want alerts
    const { data: preferences, error: prefsError } = await supabase
      .from('email_preferences')
      .select('user_id, interest_based_alerts, location_based_alerts');

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
      throw prefsError;
    }

    // Create a map of preferences by user_id
    const prefsMap = new Map<string, EmailPreference>();
    preferences?.forEach((pref) => {
      prefsMap.set(pref.user_id, pref);
    });

    // Interest to category mapping
    const interestCategoryMap: Record<string, string[]> = {
      'Hackathons': ['hackathon', 'tech', 'coding', 'competition'],
      'Coding': ['hackathon', 'tech', 'coding', 'workshop'],
      'AI/ML': ['tech', 'workshop', 'hackathon', 'seminar'],
      'Design': ['design', 'workshop', 'competition'],
      'Startups': ['entrepreneurship', 'startup', 'networking', 'seminar'],
      'Internships': ['career', 'networking', 'workshop'],
      'Research': ['seminar', 'workshop', 'conference'],
      'Sports': ['sports', 'competition', 'cultural'],
      'Music': ['cultural', 'entertainment', 'competition'],
      'Art': ['cultural', 'workshop', 'exhibition'],
      'Photography': ['workshop', 'cultural', 'competition'],
      'Writing': ['workshop', 'competition', 'cultural'],
      'Public Speaking': ['seminar', 'workshop', 'competition'],
      'Finance': ['workshop', 'seminar', 'career'],
      'Marketing': ['workshop', 'seminar', 'career'],
    };

    const notificationsToCreate: {
      user_id: string;
      title: string;
      message: string;
      type: string;
      link: string;
    }[] = [];

    // Track which users have already been notified for each event
    const notifiedUsers = new Set<string>();

    for (const event of events) {
      const eventCategory = event.category?.toLowerCase() || '';
      const eventLocation = `${event.venue_name || ''} ${event.venue_address || ''}`.toLowerCase();

      for (const profile of profiles || []) {
        // Skip if user already notified for this event
        const userEventKey = `${profile.id}-${event.id}`;
        if (notifiedUsers.has(userEventKey)) continue;

        const userPrefs = prefsMap.get(profile.id);

        // Default to true if no preferences set
        const wantsInterestAlerts = userPrefs?.interest_based_alerts ?? true;
        const wantsLocationAlerts = userPrefs?.location_based_alerts ?? true;

        let matchReason: string | null = null;

        // Check interest match
        if (wantsInterestAlerts && profile.interests && profile.interests.length > 0) {
          for (const interest of profile.interests) {
            const matchingCategories = interestCategoryMap[interest] || [];
            if (matchingCategories.some(cat => eventCategory.includes(cat)) ||
              eventCategory.includes(interest.toLowerCase())) {
              matchReason = `Matches your interest: ${interest}`;
              break;
            }
          }
        }

        // Check location match (if no interest match found)
        if (!matchReason && wantsLocationAlerts && profile.city) {
          const userCity = profile.city.toLowerCase();
          if (eventLocation.includes(userCity)) {
            matchReason = `Happening in ${profile.city}`;
          }
        }

        // Create notification if there's a match
        if (matchReason) {
          notifiedUsers.add(userEventKey);
          notificationsToCreate.push({
            user_id: profile.id,
            title: `New Event: ${event.title}`,
            message: matchReason,
            type: 'event',
            link: `/events/${event.id}`,
          });
        }
      }
    }

    console.log(`Creating ${notificationsToCreate.length} notifications`);

    // Batch insert notifications
    if (notificationsToCreate.length > 0) {
      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < notificationsToCreate.length; i += batchSize) {
        const batch = notificationsToCreate.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(batch);

        if (insertError) {
          console.error('Error inserting notifications batch:', insertError);
        } else {
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        events_processed: events.length,
        notifications_created: notificationsToCreate.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in notify-matching-events:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
