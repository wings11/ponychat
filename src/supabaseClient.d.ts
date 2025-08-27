declare module './supabaseClient' {
  import type { SupabaseClient } from '@supabase/supabase-js';
  export const supabase: SupabaseClient;
}
