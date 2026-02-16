import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path' // ADD THIS: alias support

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // ADD THIS
    },
  },
})
