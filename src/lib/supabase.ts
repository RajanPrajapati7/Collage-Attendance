import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://mmbunkxxeitgeomoynma.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tYnVua3h4ZWl0Z2VvbW95bm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjU4ODIsImV4cCI6MjA5OTUwMTg4Mn0.EZsWwJCkfaf-snE0SWqXSDoSo0YalW9Oew1Vn8oVHC8';

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
