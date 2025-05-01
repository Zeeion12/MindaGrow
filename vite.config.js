import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // support websocket
        configure: (proxy, options) => {
          // Proxy timeout settings
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
            if (res.writeHead && !res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({
                success: false, 
                message: 'Proxy error', 
                error: err.message
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add custom request headers if needed
            proxyReq.setHeader('X-Forwarded-By', 'Vite');
          });
        }
      }
    },
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      // Reduce network congestion for HMR
      protocol: 'ws',
      clientPort: 5173,
      timeout: 5000
    },
    watch: {
      // Ignore directories to reduce file monitoring
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunk to improve caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Additional chunks as needed
        }
      }
    }
  }
});