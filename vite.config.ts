import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: '味享厨 CookShare',
          short_name: 'CookShare',
          description: '基于边缘计算的美食应用 - 阿里云ESA参赛作品',
          theme_color: '#ff6b35',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          shortcuts: [
            {
              name: '生成AI视频',
              short_name: 'AI生成',
              description: '快速生成美食漫画视频',
              url: '/#ai',
              icons: [{ src: '/icons/ai-shortcut.png', sizes: '96x96' }]
            },
            {
              name: '浏览菜谱',
              short_name: '菜谱',
              description: '离线可用的菜谱库',
              url: '/#recipes',
              icons: [{ src: '/icons/recipe-shortcut.png', sizes: '96x96' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.cookshare\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 24 * 60 * 60 // 24小时
                },
                networkTimeoutSeconds: 10
              }
            },
            {
              urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
                }
              }
            }
          ],
          skipWaiting: true,
          clientsClaim: true
        },
        devOptions: {
          enabled: false,
          type: 'module',
          navigateFallback: 'index.html'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/shared/components'),
        '@utils': path.resolve(__dirname, 'src/shared/utils'),
        '@services': path.resolve(__dirname, 'src/shared/services'),
        '@hooks': path.resolve(__dirname, 'src/shared/hooks'),
        '@types': path.resolve(__dirname, 'src/shared/types')
      }
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8787', // 模拟边缘函数本地开发
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['antd', '@ant-design/icons'],
            state: ['zustand', 'axios']
          }
        }
      }
    },
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
    }
  }
})
