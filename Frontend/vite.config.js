import { defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target:'https://chatspacev2.onrender.com',
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api/, '')
        }
      },
      '/socket.io': {
        target: 'https://chatspacev2.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
});