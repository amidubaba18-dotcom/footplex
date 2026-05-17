import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
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
        categories: ['sports', 'productivity']
      }
    })
  ]
})