import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: isProduction 
          ? 'https://chatspacev2.onrender.com' // Your production backend
          : 'http://localhost:5000', // Local development
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
