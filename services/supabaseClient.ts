
/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cnmmwaoismipddjgktsm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WjxV9V3dz8NWH13HconYfA_4x3sES8O';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing from environment variables. Using provided fallbacks.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
