import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = "https://univoid.tech";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      console.error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google service account not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the service account credentials
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (e) {
      console.error('Failed to parse service account key:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid service account configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate JWT for Google API
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = { alg: 'RS256', typ: 'JWT' };
    const jwtClaim = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };

    // Base64URL encode
    const base64url = (str: string) => {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const encodedHeader = base64url(JSON.stringify(jwtHeader));
    const encodedClaim = base64url(JSON.stringify(jwtClaim));
    const signatureInput = `${encodedHeader}.${encodedClaim}`;

    // Import the private key and sign
    const pemContents = credentials.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    const signature = base64url(String.fromCharCode(...new Uint8Array(signatureBuffer)));
    const jwt = `${signatureInput}.${signature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Google' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = tokenData.access_token;

    // Get events created in the last 24 hours that haven't been indexed
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, slug, title, created_at')
      .eq('status', 'published')
      .gte('created_at', twentyFourHoursAgo);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch events' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const indexedUrls: string[] = [];
    const errors: string[] = [];

    // Submit each event URL for indexing
    for (const event of events || []) {
      const eventUrl = `${SITE_URL}/events/${event.slug || event.id}`;
      
      try {
        const indexResponse = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: eventUrl,
            type: 'URL_UPDATED',
          }),
        });

        const indexResult = await indexResponse.json();
        
        if (indexResponse.ok) {
          console.log(`Successfully submitted ${eventUrl} for indexing`);
          indexedUrls.push(eventUrl);
        } else {
          console.error(`Failed to index ${eventUrl}:`, indexResult);
          errors.push(`${event.title}: ${indexResult.error?.message || 'Unknown error'}`);
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error(`Error indexing ${eventUrl}:`, e);
        errors.push(`${event.title}: ${errorMessage}`);
      }

      // Rate limiting - Google allows 200 requests per day
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Also submit sitemap for good measure
    try {
      const sitemapUrl = `${supabaseUrl}/functions/v1/sitemap`;
      await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: sitemapUrl,
          type: 'URL_UPDATED',
        }),
      });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.log('Sitemap submission skipped:', errorMessage);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        indexed: indexedUrls.length,
        urls: indexedUrls,
        errors: errors.length > 0 ? errors : undefined,
        message: `Submitted ${indexedUrls.length} URLs for indexing` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Indexing function error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
