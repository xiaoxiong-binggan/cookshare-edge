import React, { useState, useEffect } from 'react'
import { 
  Layout, 
  Tabs, 
  Card, 
  Space, 
  Typography, 
  Button, 
  Statistic, 
  Row, 
  Col,
  Alert,
  Badge
} from 'antd'
import { 
  RobotOutlined, 
  RocketOutlined, 
  TeamOutlined,
  CloudOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  GithubOutlined // 补充缺失的Github图标导入
} from '@ant-design/icons'
import AIGenerator from '../apps/ai-generator'
import RecipeBrowser from '../apps/recipe-pwa'
import CollabEditor from '../apps/collab-space'
import EdgeStatusPanel from '../shared/components/EdgeStatusPanel'
import { useEdge } from '../shared/hooks/useEdge'
import useEdgeStore from '../shared/store/edgeStore'

const { Title, Paragraph, Text } = Typography
const { Header, Content, Footer } = Layout
const { TabPane } = Tabs

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ai')
  const [demoMode, setDemoMode] = useState(false)
  // 初始化edgeInfo默认值，避免undefined报错
  const { edgeInfo, loading, refreshEdgeInfo } = useEdge({ 
    autoRefresh: true 
  })
  const { isOnline, user } = useEdgeStore()

  // 演示数据
  const [demoStats, setDemoStats] = useState({
    videosGenerated: 124,
    recipesCached: 356,
    activeUsers: 89,
    edgeNodes: 12
  })

  // 轮询更新演示数据
  useEffect(() => {
    if (demoMode) {
      const interval = setInterval(() => {
        setDemoStats(prev => ({
          videosGenerated: prev.videosGenerated + Math.floor(Math.random() * 3),
          recipesCached: prev.recipesCached + Math.floor(Math.random() * 5),
          activeUsers: prev.activeUsers + Math.floor(Math.random() * 2),
          edgeNodes: prev.edgeNodes
        }))
      }, 3000)
      
      return () => clearInterval(interval)
    }
  }, [demoMode])

  // 给edgeInfo设置默认值，防止渲染时属性不存在报错
  const defaultEdgeInfo = {
    latency: 0,
    cacheHit: 0,
    location: '未知节点',
    status: '正常'
  }
  const currentEdgeInfo = { ...defaultEdgeInfo, ...edgeInfo }

  return (
    <Layout className="home-layout" style={{ minHeight: '100vh' }}>
      <Header className="app-header" style={{ 
        background: '#fff', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '0 24px'
      }}>
        <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <Space align="center" size="large">
            <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
              <span className="logo-icon" style={{ fontSize: '24px', marginRight: '8px' }}>🍳</span>
              <Title level={3} className="logo-text" style={{ margin: 0, color: '#1890ff' }}>
                味享厨 CookShare
                <Badge 
                  count="边缘版" 
                  style={{ 
                    backgroundColor: '#ff6b35',
                    marginLeft: 8
                  }} 
                />
              </Title>
            </div>
            
            <EdgeStatusPanel />
          </Space>

          <Button 
            type={demoMode ? 'primary' : 'default'}
            onClick={() => setDemoMode(!demoMode)}
            icon={<ThunderboltOutlined />}
          >
            {demoMode ? '演示模式 ON' : '演示模式'}
          </Button>
        </div>
      </Header>

      <Content className="main-content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 边缘计算特性展示 */}
        <section className="edge-highlights" style={{ marginBottom: '32px' }}>
          <Title level={2} className="section-title" style={{ marginBottom: '16px', color: '#2f5496' }}>
            <CloudOutlined /> 边缘计算赋能美食创作
          </Title>
          <Paragraph className="section-description" style={{ fontSize: '16px', color: '#555' }}>
            基于阿里云ESA Pages，体验全球加速、边缘AI、实时协作的美食应用
          </Paragraph>
          
          <Row gutter={[16, 16]} className="stats-row" style={{ marginTop: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Statistic
                  title="边缘延迟"
                  value={currentEdgeInfo.latency}
                  suffix="ms"
                  prefix={<GlobalOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: currentEdgeInfo.latency < 50 ? '#3f8600' : '#cf1322', fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Statistic
                  title="缓存命中率"
                  value={currentEdgeInfo.cacheHit}
                  suffix="%"
                  prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Statistic
                  title="已生成视频"
                  value={demoStats.videosGenerated}
                  prefix={<RobotOutlined style={{ color: '#ff6b35' }} />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Statistic
                  title="活跃用户"
                  value={demoStats.activeUsers}
                  prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Card>
            </Col>
          </Row>
          
          {!isOnline && (
            <Alert
              message="离线模式"
              description="当前处于离线状态，部分功能受限，但已缓存内容仍可访问"
              type="warning"
              showIcon
              style={{ marginBottom: '24px', marginTop: '16px' }}
            />
          )}
        </section>

        {/* 核心功能标签页 */}
        <section className="core-features" style={{ marginBottom: '32px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            size="large"
            className="feature-tabs"
            style={{ 
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              borderRadius: '8px'
            }}
            items={[
              {
                key: 'ai',
                label: (
                  <span>
                    <RobotOutlined style={{ marginRight: '8px' }} />
                    AI美食漫画工坊
                  </span>
                ),
                children: <AIGenerator demoMode={demoMode} />
              },
              {
                key: 'pwa',
                label: (
                  <span>
                    <RocketOutlined style={{ marginRight: '8px' }} />
                    边缘菜谱速查助手
                  </span>
                ),
                children: <RecipeBrowser />
              },
              {
                key: 'collab',
                label: (
                  <span>
                    <TeamOutlined style={{ marginRight: '8px' }} />
                    实时协作美食空间
                  </span>
                ),
                children: <CollabEditor demoMode={demoMode} />
              }
            ]}
          />
        </section>

        {/* 边缘计算技术展示 */}
        <section className="tech-demo" style={{ marginBottom: '32px' }}>
          <Title level={3} className="section-title" style={{ marginBottom: '16px', color: '#2f5496' }}>
            🚀 边缘计算技术展示
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card 
                title="全球低延迟" 
                bordered={false}
                hoverable
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                <Paragraph>
                  请求自动路由到最近的边缘节点，延迟降低 60%
                </Paragraph>
                <div className="latency-demo" style={{ marginTop: '16px' }}>
                  <div className="latency-bars" style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', justifyContent: 'center', height: '120px' }}>
                    <div className="bar traditional" style={{ height: '100px', width: '40px', background: '#f5222d', borderRadius: '4px 4px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '8px' }}>
                      <span style={{ color: '#fff', fontSize: '12px' }}>传统CDN: 150ms</span>
                    </div>
                    <div className="bar edge" style={{ height: '40px', width: '40px', background: '#1890ff', borderRadius: '4px 4px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '8px' }}>
                      <span style={{ color: '#fff', fontSize: '12px' }}>边缘计算: 40ms</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card 
                title="边缘AI推理" 
                bordered={false}
                hoverable
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                <Paragraph>
                  AI视频生成在边缘节点执行，速度快 3倍
                </Paragraph>
                <div className="ai-demo" style={{ marginTop: '16px' }}>
                  <Space direction="vertical">
                    <Text type="secondary">处理位置:</Text>
                    <Badge 
                      color="blue" 
                      text={`边缘节点: ${currentEdgeInfo.location}`}
                    />
                    <Badge 
                      color="green" 
                      text="AI模型: 通义万相"
                    />
                    <Button 
                      type="link" 
                      onClick={refreshEdgeInfo}
                      loading={loading}
                    >
                      刷新节点信息
                    </Button>
                  </Space>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card 
                title="离线可用" 
                bordered={false}
                hoverable
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                <Paragraph>
                  PWA + 边缘缓存，断网也能正常使用
                </Paragraph>
                <div className="offline-demo" style={{ marginTop: '16px' }}>
                  <Space direction="vertical" size="large">
                    <Button
                      type={isOnline ? 'default' : 'primary'}
                      icon={<CloudOutlined />}
                    >
                      {isOnline ? '在线' : '离线'}
                    </Button>
                    <Text type="secondary">
                      已缓存内容: {demoStats.recipesCached} 个菜谱
                    </Text>
                    <Button 
                      size="small"
                      onClick={() => {
                        if ('serviceWorker' in navigator) {
                          navigator.serviceWorker.getRegistrations().then(registrations => {
                            registrations.forEach(registration => registration.unregister())
                          })
                          window.location.reload()
                        }
                      }}
                    >
                      清除缓存
                    </Button>
                  </Space>
                </div>
              </Card>
            </Col>
          </Row>
        </section>
      </Content>

      <Footer className="app-footer" style={{ 
        background: '#fafafa', 
        borderTop: '1px solid #f0f0f0',
        padding: '24px'
      }}>
        <div className="footer-content" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <Paragraph className="esa-declaration" style={{ margin: '0 auto 16px auto', maxWidth: '600px' }}>
            <Text strong>
              🚀 本项目由阿里云ESA提供加速、计算和保护
            </Text>
            <br />
            <Text type="secondary">
              参赛作品 - 阿里云ESA Pages边缘开发大赛
              <br />
              当前边缘节点: {currentEdgeInfo.location} | 延迟: {currentEdgeInfo.latency}ms
            </Text>
          </Paragraph>
          
          <Space size="large" style={{ marginBottom: '16px', justifyContent: 'center' }}>
            {/* 替换为你的GitHub仓库地址 */}
            <Button 
              href="https://github.com/xiaoxiong-binggan/cookshare-edge" 
              target="_blank"
              icon={<GithubOutlined />}
            >
              GitHub仓库
            </Button>
            <Button 
              href="https://help.aliyun.com/zh/esa/developer-reference/announcement-of-esa-pages-edge-development-competition" 
              target="_blank"
              type="primary"
            >
              查看比赛详情
            </Button>
            <Button 
              onClick={() => window.open('https://esa.console.aliyun.com', '_blank')}
            >
              体验阿里云ESA
            </Button>
          </Space>
          
          <Paragraph className="copyright" type="secondary" style={{ margin: 0 }}>
            © 2024 味享厨 CookShare Edge. 保留所有权利。
            <br />
            本作品仅用于阿里云ESA Pages边缘开发大赛参赛用途。
          </Paragraph>
        </div>
      </Footer>
    </Layout>
  )
}

export default HomePage
