import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // 端口固定为 770（77 会被浏览器当成不安全端口拦掉）；被占用时直接报错，不自动换端口
    port: 770,
    strictPort: true,
    // 开发时把 /api 转发给后端，前端代码里不用写后端地址
    proxy: {
      '/api': 'http://localhost:777',
    },
  },
});
