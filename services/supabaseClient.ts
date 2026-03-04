/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
  console.warn(
    'Supabase URL or Anon Key is missing from environment variables. Falling back to offline mode.'
  );
}

export const supabase = createClient(
  hasSupabaseConfig ? supabaseUrl! : 'https://offline-project.supabase.co',
  hasSupabaseConfig ? supabaseAnonKey! : 'offline-anon-key'
);

export const isSupabaseConfigured = hasSupabaseConfig;
