import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/footplex-backend\.onrender\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 }
            }
          },
          {
            urlPattern: /.*\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 604800 }
            }
          }
        ]
      },
      manifest: {
        name: 'FootPlex - Tournament Manager',
        short_name: 'FootPlex',
        description: 'Manage football tournaments, track standings, submit scores in real-time',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        screenshots: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 720"><rect fill="%2316a34a" width="540" height="720"/><text x="270" y="360" font-size="120" font-weight="bold" fill="white" text-anchor="middle">⚽</text></svg>',
            sizes: '540x720',
            type: 'image/svg+xml',
            form_factor: 'narrow'
          }
        ],
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%2316a34a" width="192" height="192" rx="45"/><text x="96" y="130" font-size="100" font-weight="bold" fill="white" text-anchor="middle">⚽</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect fill="%2316a34a" width="512" height="512" rx="120"/><text x="256" y="350" font-size="280" font-weight="bold" fill="white" text-anchor="middle">⚽</text></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%2316a34a" width="192" height="192" rx="45"/><text x="96" y="130" font-size="100" font-weight="bold" fill="white" text-anchor="middle">⚽</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable'
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect fill="%2316a34a" width="512" height="512" rx="120"/><text x="256" y="350" font-size="280" font-weight="bold" fill="white" text-anchor="middle">⚽</text></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ],
        categories: ['sports', 'productivity'],
        shortcuts: [
          {
            name: 'Create Tournament',
            short_name: 'Create',
            description: 'Start a new tournament',
            url: '/create',
            icons: [
              {
                src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%2316a34a" width="96" height="96"/><text x="48" y="65" font-size="50" fill="white" text-anchor="middle">+</text></svg>',
                sizes: '96x96'
              }
            ]
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View your tournaments',
            url: '/dashboard',
            icons: [
              {
                src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%2316a34a" width="96" height="96"/><text x="48" y="65" font-size="50" fill="white" text-anchor="middle">📊</text></svg>',
                sizes: '96x96'
              }
            ]
          }
        ]
      }
    })
  ]
})