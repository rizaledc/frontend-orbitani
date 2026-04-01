import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend-orbitani-fkdzbherbbbzatd2.southeastasia-01.azurewebsites.net',
        changeOrigin: true,
        secure: true,
      },
      '/ws': {
        target: 'wss://backend-orbitani-fkdzbherbbbzatd2.southeastasia-01.azurewebsites.net',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
