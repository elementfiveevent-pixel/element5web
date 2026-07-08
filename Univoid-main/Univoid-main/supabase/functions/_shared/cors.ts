/**
 * Shared CORS utility for Supabase Edge Functions
 * Restricts API access to authorized origins only
 */

// Allowed origins for the UniVoid application
const ALLOWED_ORIGINS = [
    'https://univoid.tech',
    'https://www.univoid.tech',
    'https://univoid.in',
    'https://www.univoid.in',
    // Local development
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
];

/**
 * Get CORS headers based on the request origin
 * Only returns the origin if it's in the allowed list
 */
export function getCorsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get('Origin') || '';

    // Check if origin is allowed
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400', // 24 hours cache for preflight
    };
}

/**
 * Handle CORS preflight (OPTIONS) requests
 */
export function handleCorsPreflightRequest(request: Request): Response {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request)
    });
}

/**
 * Check if request is a CORS preflight
 */
export function isCorsPreflightRequest(request: Request): boolean {
    return request.method === 'OPTIONS';
}
