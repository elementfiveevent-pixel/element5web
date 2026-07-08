import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const POOL_SIZE = Number(Deno.env.get('SUPABASE_POOL_SIZE') ?? 20);

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
    },
    global: {
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    },
    db: {
        schema: 'public',
    },
});
