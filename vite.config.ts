/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Injects the strict CSP <meta> only into the production build. Vite's dev server relies
 * on a `connect-src`-violating websocket for HMR, so a build-time-only meta tag keeps
 * `npm run dev` working while `npm run build` ships locked down.
 */
function cspMetaPlugin(): Plugin {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; ')
  return {
    name: 'json-studio-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!-- %CSP_META% -->',
        `<meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      )
    },
  }
}

/**
 * GitHub Pages has no server-side rewrite, so a deep link (e.g. a refresh on a route other
 * than `/`) 404s unless `404.html` exists and itself serves the app -- GitHub Pages falls
 * back to it for any unknown path. A plain copy of `index.html` is enough here since this
 * is a single-page app with no server-rendered routing to reproduce.
 */
function spa404FallbackPlugin(): Plugin {
  return {
    name: 'json-studio-spa-404-fallback',
    apply: 'build',
    async closeBundle() {
      const fs = await import('node:fs/promises')
      const outDir = path.resolve(__dirname, 'dist')
      await fs.copyFile(path.join(outDir, 'index.html'), path.join(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [
    react(),
    cspMetaPlugin(),
    spa404FallbackPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'html-cache' },
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker', 'font', 'image'].includes(request.destination),
            handler: 'CacheFirst',
            options: { cacheName: 'asset-cache' },
          },
        ],
      },
      manifest: {
        name: 'JSON Studio',
        short_name: 'JSON Studio',
        description: 'Локальна робоча станція для роботи з JSON — усе виконується у браузері.',
        start_url: process.env.VITE_BASE_PATH ?? '/',
        display: 'standalone',
        background_color: '#0b0d12',
        theme_color: '#0b0d12',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  mode,
}))
