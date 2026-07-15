import { createClient } from '@supabase/supabase-js';

const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  url &&
    anonKey &&
    !url.includes('YOUR_PROJECT') &&
    !anonKey.includes('YOUR_ANON')
);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function publicMediaUrl(path) {
  if (!supabase || !path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data?.publicUrl || '';
}
