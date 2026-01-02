import React, { useState, useRef, useEffect } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  Select, 
  Slider, 
  Checkbox, 
  Radio,
  Progress,
  Tabs,
  message,
  Space,
  Typography
} from 'antd'
import { 
  UploadOutlined, 
  PlayCircleOutlined, 
  LoadingOutlined,
  EditOutlined,
  PictureOutlined, // 替换为正确图标
  SendOutlined
} from '@ant-design/icons'
import { useEdge } from '@hooks/useEdge'
import { aiService } from '@services/api'
import useEdgeStore from '@store/edgeStore'
import type { VideoGenerationOptions, GenerationTask } from '@types'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

const AIGenerator: React.FC<{ demoMode?: boolean }> = ({ demoMode = false }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [task, setTask] = useState<GenerationTask | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [structuredData, setStructuredData] = useState<any>(null)
  const { isOnline } = useEdge()
  const { addNotification } = useEdgeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 模拟任务进度（演示模式）
  useEffect(() => {
    if (demoMode && task?.status === 'processing') {
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        if (progress >= 100) {
          clearInterval(interval)
          setTask(prev => prev ? {
            ...prev,
            status: 'completed',
            progress: 100,
            resultUrl: 'https://example.com/demo-video.mp4'
          } : null)
          addNotification({
            type: 'success',
            title: 'AI视频生成完成',
            message: '您的美食漫画视频已生成，点击查看'
          })
        } else {
          setTask(prev => prev ? { ...prev, progress } : null)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [demoMode, task, addNotification])

  // 处理图片上传
  const handleUpload = async (file: any) => {
    if (!isOnline && !demoMode) {
      message.error('离线状态下无法使用AI分析功能')
      return false
    }

    setLoading(true)
    try {
      const response = await aiService.analyzeImage(file)
      setStructuredData(response.data)
      form.setFieldsValue({
        recipeText: response.data.recipe
      })
      message.success('图片分析完成，已提取食材和菜谱')
    } catch (error) {
      message.error('图片分析失败，请重试')
      console.error('Image analysis error:', error)
    } finally {
      setLoading(false)
    }
    return false
  }

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    if (!isOnline && !demoMode) {
      message.error('离线状态下无法使用AI生成功能')
      return
    }

    if (!values.recipeText && !values.uploadImage) {
      message.warning('请输入菜谱文字或上传图片')
      return
    }

    setLoading(true)
    try {
      const options: VideoGenerationOptions = {
        style: values.style,
        music: values.music,
        speed: values.speed,
        voice: values.voice,
        subtitles: values.subtitles,
        resolution: values.resolution
      }

      // 演示模式
      if (demoMode) {
        const demoTask: GenerationTask = {
          id: `demo-task-${Date.now()}`,
          recipeId: `demo-recipe-${Math.random().toString(36).substr(2, 9)}`,
          status: 'processing',
          progress: 0,
          estimatedTime: 5,
          edgeLocation: '杭州',
          createdAt: new Date().toISOString()
        }
        setTask(demoTask)
        message.info('演示模式：AI视频生成任务已提交')
      } 
      // 真实模式
      else {
        const response = await aiService.generateVideo('temp-recipe-id', options)
        setTask(response.data)
        message.success('AI视频生成任务已提交到边缘节点')
      }
    } catch (error) {
      message.error('任务提交失败，请重试')
      console.error('Generate video error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 查看生成结果
  const handleViewResult = () => {
    if (task?.resultUrl) {
      setPreviewUrl(task.resultUrl)
      setPreviewVisible(true)
    }
  }

  return (
    <div className="ai-generator">
      <Title level={3} className="slide-in">
        <PlayCircleOutlined /> AI美食漫画工坊
      </Title>
      <Paragraph className="slide-in">
        输入菜谱文字或上传菜品图片，AI将自动生成漫画风格的美食视频
      </Paragraph>

      <Tabs defaultActiveKey="text" className="slide-in" style={{ marginBottom: 24 }}>
        <TabPane
          tab={<span><EditOutlined /> 文字输入</span>}
          key="text"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              style: 'anime',
              music: 'upbeat',
              speed: 'normal',
              subtitles: 'zh',
              resolution: '1080p',
              voice: true
            }}
          >
            <Form.Item
              name="recipeText"
              label="菜谱描述"
              rules={[{ required: true, message: '请输入菜谱描述' }]}
            >
              <Input.TextArea
                rows={6}
                placeholder="例如：番茄炒蛋，先将鸡蛋打散，热油下锅翻炒至凝固，盛出备用；再放番茄块翻炒出汁，加少许盐和糖调味，最后倒入鸡蛋翻炒均匀即可"
              />
            </Form.Item>

            <Card title="视频风格配置" bordered={false} style={{ marginBottom: 16 }}>
              <Form.Item name="style" label="视频风格">
                <Select
                  options={[
                    { value: 'anime', label: '日系动漫' },
                    { value: 'comic', label: '美式漫画' },
                    { value: 'watercolor', label: '水彩手绘' },
                    { value: 'realistic', label: '写实风格' }
                  ]}
                />
              </Form.Item>

              <Form.Item name="music" label="背景音乐">
                <Select
                  options={[
                    { value: 'upbeat', label: '欢快节奏' },
                    { value: 'relax', label: '舒缓轻音乐' },
                    { value: 'kitchen', label: '厨房场景音' },
                    { value: 'none', label: '无音乐' }
                  ]}
                />
              </Form.Item>

              <Form.Item name="speed" label="播放速度">
                <Radio.Group>
                  <Radio value="slow">慢节奏</Radio>
                  <Radio value="normal">正常（默认）</Radio>
                  <Radio value="fast">快节奏</Radio>
                </Radio.Group>
              </Form.Item>

              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item name="voice" valuePropName="checked" label="语音旁白">
                  <Checkbox>添加美食制作解说</Checkbox>
                </Form.Item>

                <Form.Item name="subtitles" label="字幕语言">
                  <Select
                    options={[
                      { value: 'zh', label: '中文' },
                      { value: 'en', label: '英文' },
                      { value: 'jp', label: '日文' },
                      { value: 'none', label: '无字幕' }
                    ]}
                  />
                </Form.Item>

                <Form.Item name="resolution" label="视频分辨率">
                  <Select
                    options={[
                      { value: '720p', label: '720p (高清)' },
                      { value: '1080p', label: '1080p (全高清)' },
                      { value: '4k', label: '4K (超高清)' }
                    ]}
                  />
                </Form.Item>
              </Space>
            </Card>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || (task?.status === 'processing')}
                block
                size="large"
              >
                {task?.status === 'processing' ? (
                  <>
                    <LoadingOutlined /> 生成中...
                  </>
                ) : (
                  <>
                    <SendOutlined /> 生成美食漫画视频
                  </>
                )}
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane
          tab={<span><PictureOutlined /> 图片上传</span>} // 已修复图标
          key="image"
        >
          <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
            <Upload
              name="image"
              beforeUpload={handleUpload}
              showUploadList={false}
              ref={fileInputRef}
              accept="image/*"
            >
              <Space direction="vertical" size="large" align="center">
                <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <Title level={4}>点击或拖拽上传菜品图片</Title>
                <Paragraph type="secondary">
                  支持JPG、PNG格式，AI将自动识别食材并生成菜谱
                </Paragraph>
                <Button type="primary">选择图片</Button>
              </Space>
            </Upload>
          </div>

          {structuredData && (
            <div className="structured-preview slide-in">
              <Title level={4}>图片分析结果</Title>
              <Paragraph>
                <Text strong>识别到的食材：</Text>
                {structuredData.ingredients.join('、')}
              </Paragraph>
              <Paragraph>
                <Text strong>推荐菜谱：</Text>
                {structuredData.recipe}
              </Paragraph>
              <Button
                type="link"
                onClick={() => form.setFieldsValue({ recipeText: structuredData.recipe })}
              >
                一键使用该菜谱
              </Button>
            </div>
          )}
        </TabPane>
      </Tabs>

      {task && (
        <Card
          title={`任务状态：${task.status === 'processing' ? '处理中' : task.status === 'completed' ? '已完成' : '失败'}`}
          bordered={false}
          className="slide-in"
          style={{ marginTop: 24 }}
        >
          {task.status === 'processing' && (
            <>
              <Progress percent={task.progress} status="active" />
              <Paragraph style={{ marginTop: 16 }}>
                <Text type="secondary">
                  边缘节点：{task.edgeLocation} | 预计剩余时间：{task.estimatedTime}秒
                </Text>
              </Paragraph>
            </>
          )}

          {task.status === 'completed' && (
            <>
              <Progress percent={100} status="success" />
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleViewResult}
                >
                  查看生成的美食视频
                </Button>
              </div>
            </>
          )}

          {task.status === 'failed' && (
            <Paragraph type="danger">
              任务失败，请检查网络或重试
            </Paragraph>
          )}
        </Card>
      )}
    </div>
  )
}

export default AIGenerator
