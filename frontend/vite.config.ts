import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,       // Makes sure Vite runs on port 5174
    open: true,       // Auto-opens the browser
    host: '0.0.0.0',  // Allow external connections
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.app', // Allow all ngrok subdomains
      '28a7-41-90-184-83.ngrok-free.app' // Your specific ngrok URL
    ],
    proxy: {
      '/api': 'http://localhost:8000',
    },
  }
})
