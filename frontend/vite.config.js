import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        // In Docker, use the service name 'backend'. Locally, use localhost.
        target: process.env.BACKEND_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});

