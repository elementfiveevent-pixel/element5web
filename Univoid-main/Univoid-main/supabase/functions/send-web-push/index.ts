import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  link?: string;
  tag?: string;
}

interface NotificationRequest {
  user_ids?: string[];
  notification: PushPayload;
  // Optional filters for personalized notifications
  filters?: {
    state?: string;
    interests?: string[];
    college?: string;
  };
}

// Web Push VAPID signing
async function signJWT(vapidPrivateKey: string, vapidPublicKey: string, audience: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: 'mailto:support@univoid.in',
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyData = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'raw',
    privateKeyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${signatureB64}`;
}

async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;

    // Create JWT for VAPID
    const jwt = await signJWT(vapidPrivateKey, vapidPublicKey, audience);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 201 || response.status === 200) {
      console.log('[WebPush] Notification sent successfully');
      return true;
    } else if (response.status === 410 || response.status === 404) {
      console.log('[WebPush] Subscription expired/invalid');
      return false;
    } else {
      console.error('[WebPush] Failed:', response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error('[WebPush] Error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[WebPush] VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body: NotificationRequest = await req.json();

    console.log('[WebPush] Processing request:', JSON.stringify(body));

    // Get target users based on filters or specific IDs
    let query = supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth');

    if (body.user_ids && body.user_ids.length > 0) {
      query = query.in('user_id', body.user_ids);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error('[WebPush] Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[WebPush] No subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply profile-based filters if specified
    let targetUserIds = subscriptions.map(s => s.user_id);

    if (body.filters) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, state, interests, college_name')
        .in('id', targetUserIds);

      if (profiles) {
        targetUserIds = profiles.filter(profile => {
          if (body.filters?.state && profile.state !== body.filters.state) {
            return false;
          }
          if (body.filters?.college && profile.college_name !== body.filters.college) {
            return false;
          }
          if (body.filters?.interests && body.filters.interests.length > 0) {
            const userInterests = profile.interests || [];
            const hasMatchingInterest = body.filters.interests.some(
              (interest: string) => userInterests.includes(interest)
            );
            if (!hasMatchingInterest) return false;
          }
          return true;
        }).map(p => p.id);
      }
    }

    // Filter subscriptions to only matching users
    const targetSubscriptions = subscriptions.filter(s => targetUserIds.includes(s.user_id));

    console.log(`[WebPush] Sending to ${targetSubscriptions.length} users`);

    // Send notifications
    let successCount = 0;
    let failedCount = 0;
    const expiredSubscriptions: string[] = [];

    for (const sub of targetSubscriptions) {
      const success = await sendPushNotification(
        sub.endpoint,
        sub.p256dh,
        sub.auth,
        body.notification,
        vapidPublicKey,
        vapidPrivateKey
      );

      if (success) {
        successCount++;
      } else {
        failedCount++;
        expiredSubscriptions.push(sub.user_id);
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('user_id', expiredSubscriptions);
    }

    console.log(`[WebPush] Sent: ${successCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        message: 'Push notifications processed',
        sent: successCount,
        failed: failedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WebPush] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
