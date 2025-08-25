import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // 프론트에서 /auth, /recipes 로 호출하면 Vite가 http://localhost:8080 으로 프록시
      '/auth': { target: 'http://localhost:8080', changeOrigin: true },
      '/recipes': { target: 'http://localhost:8080', changeOrigin: true },
      
      // Swagger
      '/v3': { target: 'http://localhost:8080', changeOrigin: true },
      '/swagger-ui': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
