import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const apiUrl = (process.env.VITE_API_URL || fileEnv.VITE_API_URL || 'http://localhost:4000').trim();

  return {
    envPrefix: ['VITE_'],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    server: {
      proxy: {
        '/api': apiUrl,
        '/media': apiUrl,
      },
    },
  };
});
