import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all network interfaces so devices on the same WiFi can access the app
    host: '0.0.0.0',
    port: 5173,
  }
})