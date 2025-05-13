// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/SecureLink/', // ✅ CORRECT: use just the repo name with slashes
  plugins: [react()],
})
