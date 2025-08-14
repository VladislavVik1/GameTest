import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 4173,
    allowedHosts: ['gametest-vbcv.onrender.com'] 
  },

  build: {
    outDir: 'dist'
  }
})
