import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

type RequestBody = {
  bucket: string;
  path: string;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

function parseUpiIdFromContent(data: string): string | null {
  // Try standard UPI URL format
  const upiMatch = data.match(/upi:\/\/pay\?([^ \n\r\t]+)/i);
  if (upiMatch) {
    try {
      const url = new URL(`upi://pay?${upiMatch[1]}`);
      const pa = url.searchParams.get('pa');
      if (pa && UPI_REGEX.test(pa)) return pa;
    } catch (_e) {
      // Continue to other extraction methods
    }
  }

  // Try to find pa= parameter directly
  const paMatch = data.match(/pa=([^&\s]+)/i);
  if (paMatch) {
    const pa = decodeURIComponent(paMatch[1]);
    if (UPI_REGEX.test(pa)) return pa;
  }

  // Try to find any UPI ID pattern in the string
  const upiIdMatch = data.match(/([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/);
  if (upiIdMatch && UPI_REGEX.test(upiIdMatch[1])) {
    return upiIdMatch[1];
  }

  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { bucket, path }: Partial<RequestBody> = await req.json();

    console.log('scan-upi: Processing request', { bucket, path });

    if (!bucket || !path) {
      return new Response(JSON.stringify({ success: false, error: 'bucket and path are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get signed URL for the image
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('scan-upi: Could not get signed URL', signedUrlError);
      return new Response(JSON.stringify({ success: false, error: 'Could not access file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Google's ZXing-based QR decoder API (free, no API key needed)
    const zxingUrl = `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(signedUrlData.signedUrl)}`;

    console.log('scan-upi: Calling QR decode API');

    const qrResponse = await fetch(zxingUrl);
    const qrResult = await qrResponse.json();

    console.log('scan-upi: QR decode result', JSON.stringify(qrResult));

    // Extract QR data from response
    const qrData = qrResult?.[0]?.symbol?.[0]?.data;

    if (!qrData) {
      const qrError = qrResult?.[0]?.symbol?.[0]?.error;
      console.log('scan-upi: QR decode failed', qrError);
      return new Response(JSON.stringify({
        success: false,
        error: qrError || 'QR decode failed - no QR code found in image'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('scan-upi: QR content', qrData);

    const upiId = parseUpiIdFromContent(qrData);
    if (!upiId) {
      console.log('scan-upi: UPI ID not found in QR content');
      return new Response(JSON.stringify({
        success: false,
        error: 'UPI ID not found in QR - ensure this is a valid UPI payment QR'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('scan-upi: UPI ID extracted', upiId);

    return new Response(JSON.stringify({ success: true, upi_id: upiId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('scan-upi error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error processing QR image' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
