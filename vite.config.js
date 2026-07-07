import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // During local dev, `vercel dev` serves /api itself. If you instead
      // run plain `vite`, uncomment below and run the api separately.
      // '/api': 'http://localhost:3000',
    },
  },
});
