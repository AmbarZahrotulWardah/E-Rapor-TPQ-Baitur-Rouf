import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Konfigurasi Vite.
 * Proxy /api dipakai agar browser memanggil jalur relatif dan Vite
 * meneruskannya ke backend Express — menghindari masalah CORS sekaligus
 * membuat aplikasi tetap berjalan di lingkungan preview ber-proxy.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
