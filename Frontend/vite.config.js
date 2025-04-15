import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd());
  
  // Determine backend URL
  const backendUrl = mode === 'production'
    ? 'https://chatspacev2.onrender.com'
    : 'http://localhost:5000';

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api/, '')
        }
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    },
    define: {
      'process.env.NODE_ENV': `"${mode}"`  // Properly define NODE_ENV
    }
  };
});