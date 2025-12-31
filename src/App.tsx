import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { FloatButton, message } from 'antd'
import { 
  QuestionCircleOutlined, 
  CloudOutlined,
  GithubOutlined 
} from '@ant-design/icons'

import HomePage from './pages/HomePage'
import AIGeneratorPage from './pages/AIGeneratorPage'
import RecipeBrowserPage from './pages/RecipeBrowserPage'
import CollabSpacePage from './pages/CollabSpacePage'
import NotFoundPage from './pages/NotFoundPage'

import useEdgeStore from './shared/store/edgeStore'

function App() {
  const { setOnlineStatus, edgeInfo } = useEdgeStore()
  
  // 检测网络状态
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true)
      message.success('已连接到边缘网络')
    }
    
    const handleOffline = () => {
      setOnlineStatus(false)
      message.warning('网络连接已断开，启用离线模式')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus])
  
  // 检测边缘节点信息
  useEffect(() => {
    const detectEdgeNode = async () => {
      try {
        const start = performance.now()
        const response = await fetch('/api/edge-info', {
          headers: {
            'X-Edge-Detect': 'true'
          }
        })
        const end = performance.now()
        
        if (response.ok) {
          const data = await response.json()
          useEdgeStore.getState().setEdgeInfo({
            ...data,
            latency: Math.round(end - start)
          })
        }
      } catch (error) {
        console.warn('边缘节点检测失败:', error)
      }
    }
    
    detectEdgeNode()
    const interval = setInterval(detectEdgeNode, 60000) // 每分钟检测一次
    
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ai-generator" element={<AIGeneratorPage />} />
        <Route path="/recipes" element={<RecipeBrowserPage />} />
        <Route path="/collab" element={<CollabSpacePage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      
      {/* 全局浮动按钮 */}
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 24 }}
        icon={<QuestionCircleOutlined />}
      >
        <FloatButton
          icon={<CloudOutlined />}
          tooltip={`边缘节点: ${edgeInfo.location} (${edgeInfo.latency}ms)`}
        />
        <FloatButton
          icon={<GithubOutlined />}
          onClick={() => window.open('https://github.com/your-username/cookshare-edge', '_blank')}
          tooltip="查看GitHub仓库"
        />
        <FloatButton.BackTop visibilityHeight={100} />
      </FloatButton.Group>
    </>
  )
}

export default App
