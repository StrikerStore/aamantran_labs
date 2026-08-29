import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 5175 — admin owns 5174, the couple dashboard 3001, the landing site 3000.
    port: 5175,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      // Invite previews are served by the backend; proxying them in dev keeps
      // the preview iframe same-origin so no CSP juggling is needed locally.
      '/i':   { target: 'http://localhost:4000', changeOrigin: true },
      '/s/':  { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
})
