import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'http://localhost:5001'

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: 'dist',
    sourcemap: false,       // disable in prod — keeps bundle small
    chunkSizeWarningLimit: 1500,
  },

  // Dev server proxy
  server: {
    port: 3000,
    proxy: {
      '/api':    { target: BACKEND, changeOrigin: true },
      '/health': { target: BACKEND, changeOrigin: true },
    },
  },

  // Preview server (npm run preview) — same proxy so build can be tested locally
  preview: {
    port: 4173,
    proxy: {
      '/api':    { target: BACKEND, changeOrigin: true },
      '/health': { target: BACKEND, changeOrigin: true },
    },
  },
})
