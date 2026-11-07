import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // El CORS del backend solo admite http://localhost:5173
    // (app.cors.allowed-origin). Si el puerto está ocupado, falla en vez de usar otro.
    port: 5173,
    strictPort: true,
  },
})
