import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getCorsHeaders,
  isCorsPreflightRequest,
  handleCorsPreflightRequest,
} from "../_shared/cors.ts";

/**
 * FILE PROXY EDGE FUNCTION
 * 
 * This function proxies all file requests to hide Supabase infrastructure from end users.
 * Users will only see UniVoid URLs - Supabase domains are never exposed.
 * 
 * Usage:
 * - /file-proxy?bucket=materials&path=userId/file.pdf
 * - /file-proxy?bucket=book-images&path=userId/image.jpg
 * - /file-proxy?bucket=profile-photos&path=userId/photo.jpg
 * - /file-proxy?id=material-uuid (for materials by ID)
 */

// Allowed buckets for security
const ALLOWED_BUCKETS = [
  'materials',
  'book-images', 
  'profile-photos',
  'event-assets',
  'organizer-logos',
  'news-images',
];

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain; charset=utf-8',
  rtf: 'application/rtf',
  epub: 'application/epub+zip',
  mobi: 'application/x-mobipocket-ebook',
  csv: 'text/csv; charset=utf-8',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
};

function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES[ext] || 'application/octet-stream';
}

serve(async (req) => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    const url = new URL(req.url);
    const bucket = url.searchParams.get('bucket');
    const path = url.searchParams.get('path');
    const materialId = url.searchParams.get('id');
    const download = url.searchParams.get('download') === 'true';

    // Create Supabase client with service role (hidden from user)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let targetBucket = bucket;
    let targetPath = path;
    let fileName = '';

    // If materialId is provided, look up the file path from the database
    if (materialId) {
      const { data: material, error } = await supabase
        .from('materials')
        .select('file_url, title, file_type')
        .eq('id', materialId)
        .single();

      if (error || !material) {
        return new Response(JSON.stringify({ error: 'Material not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      targetBucket = 'materials';
      targetPath = material.file_url;
      fileName = `${material.title || 'download'}.${material.file_type || 'pdf'}`;

      // If it's already a full URL (legacy), extract the path
      if (targetPath?.startsWith('http')) {
        const pathMatch = targetPath.match(/\/storage\/v1\/object\/(?:public|sign)\/materials\/(.+?)(?:\?|$)/);
        if (pathMatch) {
          targetPath = pathMatch[1];
        }
      }
    }

    // Validate inputs
    if (!targetBucket || !targetPath) {
      return new Response(JSON.stringify({ error: 'Missing bucket or path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Security: Only allow whitelisted buckets
    if (!ALLOWED_BUCKETS.includes(targetBucket)) {
      return new Response(JSON.stringify({ error: 'Invalid bucket' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode path in case it's URL encoded
    const decodedPath = decodeURIComponent(targetPath);

    // Download file from Supabase storage (server-side)
    const { data, error } = await supabase.storage
      .from(targetBucket)
      .download(decodedPath);

    if (error || !data) {
      console.error('Storage download error:', error);
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine content type and filename
    const contentType = getMimeType(decodedPath);
    if (!fileName) {
      fileName = decodedPath.split('/').pop() || 'file';
    }

    // Set appropriate headers
    const headers: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // 1 hour cache
      'X-Content-Type-Options': 'nosniff',
    };

    // If download requested, set content-disposition
    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${fileName}"`;
    } else {
      headers['Content-Disposition'] = `inline; filename="${fileName}"`;
    }

    // Stream the file back to the user (Supabase URL never exposed)
    return new Response(data, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('File proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
