import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'cn': path.resolve(import.meta.dirname, './src/lib/utils'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // AG Studio is an enterprise BI analytics package (~4.1MB minified) isolated in its own chunk.
    chunkSizeWarningLimit: 4500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('ag-studio') || id.includes('ag-studio-react')) {
              return 'ag-studio'
            }
            if (id.includes('ag-grid-enterprise')) {
              return 'ag-grid-enterprise'
            }
            if (id.includes('ag-grid-community') || id.includes('ag-grid-react')) {
              return 'ag-grid-community'
            }
            if (id.includes('@paypal')) {
              return 'paypal-vendor'
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }
            if (id.includes('lucide-react')) {
              return 'lucide-icons'
            }
            if (id.includes('radix-ui') || id.includes('@radix-ui')) {
              return 'radix-ui'
            }
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-router-dom/') ||
              id.includes('/zustand/')
            ) {
              return 'react-vendor'
            }
          }
        },
      },
    },
  },
})
