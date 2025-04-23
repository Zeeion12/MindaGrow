// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Menambahkan konfigurasi server proxy jika diperlukan untuk API
  server: {
    port: 3000,
    // Menghindari CORS issues jika perlu
    proxy: {
      // '/api': {
      //   target: 'https://api.groq.com',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // }
    }
  },
  // Lingkungan variabel akan diambil dari file .env
  envPrefix: 'VITE_'
})