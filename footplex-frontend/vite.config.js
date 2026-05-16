import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FootPlex',
        short_name: 'FootPlex',
        description: 'Tournament management platform',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%2316a34a" width="192" height="192"/><text x="96" y="120" font-size="80" font-weight="bold" fill="white" text-anchor="middle">⚽</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%2316a34a" width="192" height="192"/><text x="96" y="120" font-size="80" font-weight="bold" fill="white" text-anchor="middle">⚽</text></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(jpg|jpeg|png|gif|svg)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 50, maxAgeSeconds: 604800 } }
          },
          {
            urlPattern: /^https:\/\/api\..*\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api', networkTimeoutSeconds: 5 }
          }
        ]
      }
    })
  ]
})