// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // ✅ CORRECT: use just the repo name with slashes
  plugins: [react()],
})
