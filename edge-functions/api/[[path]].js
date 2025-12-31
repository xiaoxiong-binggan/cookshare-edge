// 边缘函数主入口 - 阿里云ESA Pages规范
export async function onRequest(context) {
  const { request, env, next, data } = context
  
  try {
    // 记录请求信息（边缘节点日志）
    const url = new URL(request.url)
    const startTime = Date.now()
    
    console.log(`[Edge] ${request.method} ${url.pathname}`, {
      region: env.REGION,
      geo: request.cf?.country || 'unknown',
      ip: request.headers.get('cf-connecting-ip')
    })
    
    // 添加边缘计算相关头
    const headers = new Headers(request.headers)
    headers.set('X-Edge-Region', env.REGION || 'global')
    headers.set('X-Edge-Request-ID', generateRequestId())
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers,
        status: 204
      })
    }
    
    // 路由处理
    const path = url.pathname.replace(/^\/api/, '')
    
    // 动态路由到对应的处理函数
    const response = await handleRoute(path, request, env, data)
    
    // 添加响应头
    const responseHeaders = new Headers(response.headers)
    const endTime = Date.now()
    
    responseHeaders.set('X-Edge-Location', env.REGION || 'global')
    responseHeaders.set('X-Edge-Processing-Time', `${endTime - startTime}ms`)
    responseHeaders.set('X-Edge-Cache', 'MISS')
    
    // 缓存控制
    if (request.method === 'GET') {
      responseHeaders.set('Cache-Control', 'public, max-age=300')
      responseHeaders.set('CDN-Cache-Control', 'public, max-age=86400')
    }
    
    // 添加边缘计算信息到响应体（如果是JSON）
    if (responseHeaders.get('Content-Type')?.includes('application/json')) {
      try {
        const body = await response.clone().json()
        
        // 添加边缘计算元数据
        const enhancedBody = {
          ...body,
          _edge: {
            region: env.REGION,
            processingTime: endTime - startTime,
            timestamp: new Date().toISOString(),
            cacheStatus: 'MISS'
          }
        }
        
        return new Response(JSON.stringify(enhancedBody), {
          status: response.status,
          headers: responseHeaders
        })
      } catch {
        // 如果不是JSON，返回原始响应
      }
    }
    
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    })
    
  } catch (error) {
    console.error('[Edge Error]', error)
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      _edge: {
        error: true,
        region: env.REGION,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Edge-Error': 'true'
      }
    })
  }
}

// 路由处理
async function handleRoute(path, request, env) {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  
  // 边缘信息服务
  if (path === '/edge-info' || path === '/api/edge-info') {
    return handleEdgeInfo(request, env)
  }
  
  // AI生成服务
  if (path.startsWith('/ai/')) {
    return handleAIService(path.replace('/ai/', ''), request, env)
  }
  
  // 菜谱服务
  if (path.startsWith('/recipes')) {
    return handleRecipeService(path.replace('/recipes', ''), request, env)
  }
  
  // 用户服务
  if (path.startsWith('/auth/')) {
    return handleAuthService(path.replace('/auth/', ''), request, env)
  }
  
  // 默认返回404
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'The requested API endpoint does not exist'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  })
}

// 边缘信息处理
async function handleEdgeInfo(request, env) {
  const edgeInfo = {
    location: getLocationName(env.REGION),
    region: env.REGION || 'global',
    latency: Math.floor(Math.random() * 30) + 10, // 模拟延迟 10-40ms
    cacheHit: Math.floor(Math.random() * 40) + 60, // 模拟命中率 60-100%
    timestamp: new Date().toISOString(),
    server: 'Aliyun ESA Pages',
    version: '1.0.0'
  }
  
  return new Response(JSON.stringify({
    success: true,
    data: edgeInfo,
    message: 'Edge information retrieved successfully'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30'
    }
  })
}

// AI服务处理
async function handleAIService(subPath, request, env) {
  switch (subPath) {
    case 'generate':
      return handleAIGenerate(request, env)
    case 'analyze':
      return handleAIAnalyze(request, env)
    case 'suggest':
      return handleAISuggest(request, env)
    default:
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'AI service endpoint not found'
      }), { status: 404 })
  }
}

// AI视频生成
async function handleAIGenerate(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), { status: 405 })
  }
  
  try {
    const body = await request.json()
    const { recipeId, options = {} } = body
    
    // 生成任务ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 模拟AI处理时间（实际应调用阿里云AI服务）
    const processingTime = Math.floor(Math.random() * 5000) + 3000 // 3-8秒
    
    // 这里应该调用阿里云通义万相API
    // const result = await callAliyunAI(recipeId, options)
    
    // 模拟返回
    const response = {
      success: true,
      data: {
        taskId,
        status: 'processing',
        progress: 0,
        estimatedTime: processingTime,
        edgeLocation: env.REGION,
        recipeId,
        options,
        createdAt: new Date().toISOString()
      },
      message: 'AI视频生成任务已提交到边缘节点'
    }
    
    // 在实际应用中，这里应该将任务放入队列异步处理
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: error.message
    }), { status: 400 })
  }
}

// 辅助函数
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getLocationName(region) {
  const locationMap = {
    'cn-hangzhou': '杭州',
    'cn-beijing': '北京',
    'cn-shanghai': '上海',
    'cn-shenzhen': '深圳',
    'cn-hongkong': '香港',
    'us-west-1': '美国西部',
    'eu-central-1': '欧洲中部',
    'ap-southeast-1': '新加坡'
  }
  
  return locationMap[region] || region || '全球边缘'
}
