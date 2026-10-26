import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The home page and content pages are static files in public/.
// The React calculator is built as its own page at /calculator/.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'calculator/index.html',
    },
  },
})
