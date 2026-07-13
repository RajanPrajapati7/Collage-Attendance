import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createSupabaseClient() {
  if (!url || !anonKey) {
    console.warn('Supabase env vars are missing.');
    return null;
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

export const supabase = createSupabaseClient();
