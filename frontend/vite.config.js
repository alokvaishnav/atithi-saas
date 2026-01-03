import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Atithi Hotel SaaS',
        short_name: 'Atithi',
        description: 'Professional Hotel Management System',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  
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