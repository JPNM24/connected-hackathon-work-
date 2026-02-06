import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper to check if a string is a valid URL
function isValidUrl(str: string | undefined): boolean {
    if (!str) return false;
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

let supabase: SupabaseClient;

const hasValidCredentials = isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key';

if (hasValidCredentials) {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!);
} else {
    console.warn(
        '[Supabase] Missing or invalid environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
        'Auth and database features will not work. Please create a .env file with valid Supabase credentials.'
    );
    // Create a mock client that won't crash but won't work for auth
    // We use a real Supabase URL format to pass validation, but it won't have real credentials
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-anon-key-that-wont-work');
}

export { supabase };

