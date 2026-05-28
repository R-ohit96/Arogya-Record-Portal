import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/sandbox': {
        target: 'https://test-api.sandbox.co.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sandbox/, ''),
      },
    },
  },
})
