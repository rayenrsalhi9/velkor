import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/claims': apiProxy(),
      '/roles': apiProxy(),
      '/users': apiProxy(),
    },
  },
})

// API routes share paths with SPA pages (e.g. /roles); only rewrite plain
// browser navigations (Accept: text/html) to "/" so Vite's SPA fallback serves
// index.html. Everything else — including tokenless API GETs — is forwarded so
// the API's 401s reach authFetch's refresh flow. Note: bypass must NOT return
// false (Vite turns that into 404).
function apiProxy(): { target: string; bypass: (req: { method?: string; headers: Record<string, string | string[] | undefined> }) => string | undefined } {
  return {
    target: 'http://localhost:3000',
    bypass: (req) => {
      const isDocumentNavigation =
        req.headers.accept?.includes('text/html');
      return isDocumentNavigation ? '/' : undefined;
    },
  }
}
