import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path' // 🟢 ADDED: Required for alias resolution

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  // Default to local backend if not specified in .env
  const API_TARGET = env.VITE_API_URL || 'http://127.0.0.1:8000';

  return {
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
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],

    // 🟢 ADDED: Resolve Aliases (Best Practice)
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    // Development Server Configuration
    server: {
      host: true, // Expose to network (allows testing on mobile via WiFi IP)
      port: 5173,
      
      // Proxy setup to forward API calls to Backend to avoid CORS in dev
      proxy: {
        '/api': {
          target: API_TARGET, 
          changeOrigin: true,
          secure: false,
        },
        // Forward media files (images/logos) correctly
        '/media': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false,
        }
      }
    },

    // Production Build Optimizations
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Disable sourcemaps in prod for security/size
      
      // 🟢 ADDED: CommonJS Options to fix Recharts/Third-party library errors
      commonjsOptions: {
        transformMixedEsModules: true,
      },

      rollupOptions: {
        output: {
          // Smart Chunk Splitting: Keeps the main bundle light
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-animation';
              }
              if (id.includes('react-big-calendar') || id.includes('moment')) {
                return 'vendor-calendar';
              }
              // 🟢 ADDED: Separate Recharts to prevent vendor bundle corruption
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              return 'vendor-others';
            }
          }
        }
      }
    }
  }
})