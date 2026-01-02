import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Server Configuration
  server: {
    host: true, // Expose to network (good for testing on mobile via same WiFi)
    port: 5173,
    
    // Proxy setup to forward API calls to Django backend during development
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Your running Django server
        changeOrigin: true,
        secure: false,
      },
      // Also forward media files (like uploaded logos)
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})