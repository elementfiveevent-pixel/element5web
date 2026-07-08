import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabaseClient.ts";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
    if (isCorsPreflightRequest(req)) {
        return handleCorsPreflightRequest(req);
    }
    const corsHeaders = getCorsHeaders(req);

    try {
        // Basic connectivity check
        const { error } = await supabase.from('events').select('id').limit(1);

        const dbStatus = error ? 'error' : 'connected';

        // In a real scenario, you might want to check detailed pool stats if possible
        // via a dedicated RPC or by assuming if the select works, the pool is operational.

        const health = {
            status: dbStatus === 'connected' ? 'ok' : 'degraded',
            db: dbStatus,
            timestamp: Date.now(),
            dbPoolSize: Number(Deno.env.get('SUPABASE_POOL_SIZE') ?? 20)
        };

        return new Response(JSON.stringify(health), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: dbStatus === 'connected' ? 200 : 503,
        });
    } catch (err) {
        return new Response(JSON.stringify({ status: 'error', message: String(err) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
