import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const servidor = 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': servidor, '/imagenes': servidor },
  },
});
