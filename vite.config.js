import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { outDir: 'dist' },
  preview: {
    allowedHosts: ['gametest-qp87.onrender.com'],
    host: '0.0.0.0',
    port: process.env.PORT || 4173
  }
});