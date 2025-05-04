import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import ElementPlus from 'unplugin-element-plus/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ElementPlus({})
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'path': 'path-browserify',
      'element-plus/lib/locale/lang/zh-cn': resolve(__dirname, 'node_modules/element-plus/lib/locale/lang/zh-cn.js')
    }
  },
  base: './',
  optimizeDeps: {
    include: [
      'vue-router'
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  assetsInclude: ['**/*.jpg'],
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true'
  }
})
