import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './', // 使用相对路径，这样可以适应任何部署环境
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
