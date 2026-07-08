import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getCorsHeaders,
  isCorsPreflightRequest,
  handleCorsPreflightRequest,
} from "../_shared/cors.ts";

/**
 * IMAGE PROXY EDGE FUNCTION
 * 
 * Lightweight proxy specifically for images that need to be displayed inline.
 * Optimized for fast response with proper caching headers.
 * 
 * Usage:
 * - /image-proxy?bucket=profile-photos&path=userId/photo.jpg
 * - /image-proxy?bucket=event-assets&path=userId/flyer.png
 */

const ALLOWED_BUCKETS = [
  'materials',
  'book-images', 
  'profile-photos',
  'event-assets',
  'organizer-logos',
  'news-images',
];

const IMAGE_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
};

serve(async (req) => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    const url = new URL(req.url);
    const bucket = url.searchParams.get('bucket');
    const path = url.searchParams.get('path');

    if (!bucket || !path) {
      return new Response(JSON.stringify({ error: 'Missing bucket or path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return new Response(JSON.stringify({ error: 'Invalid bucket' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const decodedPath = decodeURIComponent(path);
    const ext = decodedPath.split('.').pop()?.toLowerCase() || '';
    const contentType = IMAGE_MIME_TYPES[ext] || 'image/jpeg';

    // Download from storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(decodedPath);

    if (error || !data) {
      console.error('Image proxy error:', error);
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return image with aggressive caching (images rarely change)
    return new Response(data, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
