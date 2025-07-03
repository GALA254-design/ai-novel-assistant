import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'ngrok-free.app',
      '28a7-41-90-184-83.ngrok-free.app', // Your specific ngrok URL
    ],
    proxy: {
<<<<<<< HEAD
      '/api': 'http://localhost:8000',
    },
  }
})
=======
      // Proxy to bypass CORS for story generation
      '/api/story': {
        target: 'https://n8nromeo123987.app.n8n.cloud',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/story/, '/webhook/ultimate-agentic-novel'),
      },
    },
  },
});

>>>>>>> 3e3e879f518c32329bc841962304115b9482af36
