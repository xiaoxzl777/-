import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 开发时把 /api 转发给后端，前端代码里不用写后端地址
    proxy: {
      '/api': 'http://localhost:8081',
    },
  },
});
