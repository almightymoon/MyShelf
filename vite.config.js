import { defineConfig, loadEnv } from 'vite';

/**
 * Vercel’s Supabase integration syncs NEXT_PUBLIC_* / SUPABASE_* names.
 * Vite normally only exposes VITE_* to the browser — we map every common
 * name into VITE_SUPABASE_* at build time so local + Vercel both work.
 */
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const get = (...keys) => {
    for (const key of keys) {
      const value = (process.env[key] || fileEnv[key] || '').trim();
      if (value) return value;
    }
    return '';
  };

  const url = get(
    'VITE_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_URL'
  );
  const key = get(
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_PUBLISHABLE_KEY'
  );

  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(key),
    },
  };
});
