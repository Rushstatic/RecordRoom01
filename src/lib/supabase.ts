import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Production Supabase endpoint & publishable key for this application
// Ensures GitHub Pages and static deployments connect seamlessly even without build-time secrets
export const DEFAULT_SUPABASE_URL = 'https://smhmgdwbiqsnrnavflrk.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_eF89esWMkXiR17kwJBr8ng_A8UmuHSU';

// Environment variables read via Vite
const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const isInvalidUrl = !envUrl || envUrl === 'https://your-project-id.supabase.co' || envUrl === 'undefined';
const isInvalidKey = !envAnonKey || envAnonKey === 'your-anon-key' || envAnonKey === 'undefined';

// Check for local storage override if user customized it
const customUrl = typeof window !== 'undefined' ? localStorage.getItem('arogya_supabase_url')?.trim() : null;
const customAnonKey = typeof window !== 'undefined' ? localStorage.getItem('arogya_supabase_anon_key')?.trim() : null;

export const supabaseUrl = customUrl || (!isInvalidUrl ? envUrl : DEFAULT_SUPABASE_URL);
export const supabaseAnonKey = customAnonKey || (!isInvalidKey ? envAnonKey : DEFAULT_SUPABASE_ANON_KEY);

/**
 * Check if Supabase credentials are configured in .env or deployment environment
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
  );
};

/**
 * Supabase client instance
 * Returns a configured client if credentials exist, or a dummy/null client for safe initialization
 */
let client: SupabaseClient | null = null;

if (isSupabaseConfigured() && supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
  }
}

export const supabase = client;

export const getSupabaseConfig = () => {
  return {
    url: supabaseUrl || '',
    isConfigured: isSupabaseConfigured(),
  };
};
