import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import ElementPlus from 'unplugin-element-plus/vite'
import { loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      ElementPlus({
        // options
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        'path': 'path-browserify',
        'element-plus/lib/locale/lang/zh-cn': resolve(__dirname, 'node_modules/element-plus/lib/locale/lang/zh-cn.js')
      }
    },
    base: '/',
    optimizeDeps: {
      include: [
        'vue-router'
      ]
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      open: true,
      cors: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8081',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:8081',
          changeOrigin: true,
        }
      }
    },
    assetsInclude: ['**/*.jpg'],
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true'
    }
  }
})
