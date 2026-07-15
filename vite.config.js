import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  // Production behind Apache (:7878) must use same-origin "" so /api hits the VPS proxy.
  // Local `npm run dev` defaults to the API on :4000 unless overridden.
  const fromEnv = (process.env.VITE_API_URL ?? fileEnv.VITE_API_URL);
  const apiUrl =
    fromEnv !== undefined
      ? String(fromEnv).trim().replace(/\/$/, '')
      : mode === 'development'
        ? 'http://localhost:4000'
        : '';

  return {
    envPrefix: ['VITE_'],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    server: {
      proxy: {
        '/api': apiUrl || 'http://localhost:4000',
        '/media': apiUrl || 'http://localhost:4000',
      },
    },
  };
});
