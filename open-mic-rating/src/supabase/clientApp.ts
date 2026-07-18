import { createClient } from '@supabase/supabase-js';

// These should be set in .env.local via process.env.NEXT_PUBLIC_SUPABASE_URL 
// and process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// Using placeholder logic so it compiles. 
// You MUST provide the real values to use Supabase.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
