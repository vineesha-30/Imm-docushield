import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // FIX: Use '.' instead of process.cwd() as process.cwd() property might be missing in some TS environments
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      // This shim allows code using 'process.env.VAR' to work in the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      // Safe fallback for other process.env usage
      'process.env': JSON.stringify({
        NODE_ENV: mode
      })
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    server: {
      port: 3000,
      host: true
    }
  };
});