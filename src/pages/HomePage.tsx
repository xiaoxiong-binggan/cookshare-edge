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
  GlobalOutlined
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
  const { edgeInfo, loading, refreshEdgeInfo } = useEdge({ autoRefresh: true })
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

  return (
    <Layout className="home-layout">
      <Header className="app-header">
        <div className="header-content">
          <Space align="center" size="large">
            <div className="logo">
              <span className="logo-icon">🍳</span>
              <Title level={3} className="logo-text">
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
            
            <Button 
              type={demoMode ? 'primary' : 'default'}
              onClick={() => setDemoMode(!demoMode)}
              icon={<ThunderboltOutlined />}
            >
              {demoMode ? '演示模式 ON' : '演示模式'}
            </Button>
          </Space>
        </div>
      </Header>

      <Content className="main-content">
        {/* 边缘计算特性展示 */}
        <section className="edge-highlights">
          <Title level={2} className="section-title">
            <CloudOutlined /> 边缘计算赋能美食创作
          </Title>
          <Paragraph className="section-description">
            基于阿里云ESA Pages，体验全球加速、边缘AI、实时协作的美食应用
          </Paragraph>
          
          <Row gutter={[16, 16]} className="stats-row">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="边缘延迟"
                  value={edgeInfo.latency}
                  suffix="ms"
                  prefix={<GlobalOutlined />}
                  valueStyle={{ color: edgeInfo.latency < 50 ? '#3f8600' : '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="缓存命中率"
                  value={edgeInfo.cacheHit}
                  suffix="%"
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="已生成视频"
                  value={demoStats.videosGenerated}
                  prefix={<RobotOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="活跃用户"
                  value={demoStats.activeUsers}
                  prefix={<TeamOutlined />}
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
              style={{ marginBottom: 24 }}
            />
          )}
        </section>

        {/* 核心功能标签页 */}
        <section className="core-features">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            size="large"
            className="feature-tabs"
            items={[
              {
                key: 'ai',
                label: (
                  <span>
                    <RobotOutlined />
                    AI美食漫画工坊
                  </span>
                ),
                children: <AIGenerator demoMode={demoMode} />
              },
              {
                key: 'pwa',
                label: (
                  <span>
                    <RocketOutlined />
                    边缘菜谱速查助手
                  </span>
                ),
                children: <RecipeBrowser />
              },
              {
                key: 'collab',
                label: (
                  <span>
                    <TeamOutlined />
                    实时协作美食空间
                  </span>
                ),
                children: <CollabEditor demoMode={demoMode} />
              }
            ]}
          />
        </section>

        {/* 边缘计算技术展示 */}
        <section className="tech-demo">
          <Title level={3} className="section-title">
            🚀 边缘计算技术展示
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card 
                title="全球低延迟" 
                bordered={false}
                hoverable
              >
                <Paragraph>
                  请求自动路由到最近的边缘节点，延迟降低 60%
                </Paragraph>
                <div className="latency-demo">
                  <div className="latency-bars">
                    <div className="bar traditional" style={{ height: '100px' }}>
                      <span>传统CDN: 150ms</span>
                    </div>
                    <div className="bar edge" style={{ height: '40px' }}>
                      <span>边缘计算: 40ms</span>
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
              >
                <Paragraph>
                  AI视频生成在边缘节点执行，速度快 3倍
                </Paragraph>
                <div className="ai-demo">
                  <Space direction="vertical">
                    <Text type="secondary">处理位置:</Text>
                    <Badge 
                      color="blue" 
                      text={`边缘节点: ${edgeInfo.location}`}
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
              >
                <Paragraph>
                  PWA + 边缘缓存，断网也能正常使用
                </Paragraph>
                <div className="offline-demo">
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

      <Footer className="app-footer">
        <div className="footer-content">
          <Paragraph className="esa-declaration">
            <Text strong>
              🚀 本项目由阿里云ESA提供加速、计算和保护
            </Text>
            <br />
            <Text type="secondary">
              参赛作品 - 阿里云ESA Pages边缘开发大赛
              <br />
              当前边缘节点: {edgeInfo.location} | 延迟: {edgeInfo.latency}ms
            </Text>
          </Paragraph>
          
          <Space size="large">
            <Button 
              href="https://github.com/your-username/cookshare-edge" 
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
          
          <Paragraph className="copyright" type="secondary">
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
