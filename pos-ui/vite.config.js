import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Mandatory for Electron ASAR
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})