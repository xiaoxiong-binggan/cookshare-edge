import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import App from './App'
import './styles/global.css'

// 设置语言
dayjs.locale('zh-cn')

// PWA注册
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(error => {
        console.log('SW registration failed: ', error)
      })
  })
}

// 边缘计算检测
const checkEdgeCapabilities = () => {
  const capabilities = {
    serviceWorker: 'serviceWorker' in navigator,
    cache: 'caches' in window,
    webSocket: 'WebSocket' in window,
    webGL: !!document.createElement('canvas').getContext('webgl'),
    wasm: (() => {
      try {
        return typeof WebAssembly === 'object' && 
          typeof WebAssembly.instantiate === 'function'
      } catch {
        return false
      }
    })()
  }
  
  localStorage.setItem('edge_capabilities', JSON.stringify(capabilities))
}

checkEdgeCapabilities()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#ff6b35',
            borderRadius: 8,
            colorBgContainer: '#ffffff',
          },
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
)
