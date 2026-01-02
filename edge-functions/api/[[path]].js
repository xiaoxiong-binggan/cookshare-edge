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
    
    // 路由处理：统一去除/api前缀，方便前端请求
    const path = url.pathname.replace(/^\/api/, '')
    
    // 动态路由到对应的处理函数
    const response = await handleRoute(path, request, env, data)
    
    // 添加响应头
    const responseHeaders = new Headers(response.headers)
    const endTime = Date.now()
    
    responseHeaders.set('X-Edge-Location', env.REGION || 'global')
    responseHeaders.set('X-Edge-Processing-Time', `${endTime - startTime}ms`)
    responseHeaders.set('X-Edge-Cache', 'MISS')
    
    // 缓存控制：GET请求设置缓存，其他请求不缓存
    if (request.method === 'GET') {
      responseHeaders.set('Cache-Control', 'public, max-age=300')
      responseHeaders.set('CDN-Cache-Control', 'public, max-age=86400')
    } else {
      responseHeaders.set('Cache-Control', 'no-store, no-cache')
    }
    
    // 添加边缘计算信息到响应体（如果是JSON格式）
    if (responseHeaders.get('Content-Type')?.includes('application/json')) {
      try {
        const body = await response.clone().json()
        
        // 添加边缘计算元数据，不污染业务数据
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
      } catch (e) {
        // 非JSON格式，直接返回原始响应
        console.log('[Edge] Response is not JSON, return original')
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
      message: error.message || 'Unknown error occurred on edge node',
      _edge: {
        error: true,
        region: env.REGION,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Edge-Error': 'true',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

// 路由处理核心函数
async function handleRoute(path, request, env) {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  
  // 边缘信息服务（支持带/api和不带/api前缀）
  if (path === '/edge-info' || path === '/api/edge-info') {
    return handleEdgeInfo(request, env)
  }
  
  // AI生成服务（/ai/xxx 接口）
  if (path.startsWith('/ai/')) {
    return handleAIService(path.replace('/ai/', ''), request, env)
  }
  
  // 菜谱服务（/recipes 相关接口）
  if (path.startsWith('/recipes')) {
    return handleRecipeService(path.replace('/recipes', ''), request, env)
  }
  
  // 用户认证服务（/auth/xxx 接口）
  if (path.startsWith('/auth/')) {
    return handleAuthService(path.replace('/auth/', ''), request, env)
  }
  
  // 默认返回404 Not Found
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'The requested API endpoint does not exist',
    _edge: {
      region: env.REGION,
      timestamp: new Date().toISOString()
    }
  }), {
    status: 404,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

// 1. 边缘信息处理函数（已完善）
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
      'Cache-Control': 'public, max-age=30',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

// 2. AI服务总入口（已完善）
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
        message: `AI service endpoint '/ai/${subPath}' not found`,
        _edge: { region: env.REGION }
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
  }
}

// 2.1 AI视频生成（原有函数，优化异常处理）
async function handleAIGenerate(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      message: 'Only POST method is supported for AI generate',
      _edge: { region: env.REGION }
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  try {
    const body = await request.json()
    const { recipeId, options = {} } = body

    // 校验必要参数
    if (!recipeId) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'RecipeId is required for AI generate',
        _edge: { region: env.REGION }
      }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }
    
    // 生成唯一任务ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 模拟AI处理时间（3-8秒）
    const processingTime = Math.floor(Math.random() * 5000) + 3000
    
    // 模拟返回结果（实际项目中可对接阿里云通义万相/视频生成API）
    const responseData = {
      success: true,
      data: {
        taskId,
        status: 'processing',
        progress: 0,
        estimatedTime: Math.ceil(processingTime / 1000), // 转换为秒
        edgeLocation: getLocationName(env.REGION),
        recipeId,
        options,
        createdAt: new Date().toISOString()
      },
      message: 'AI视频生成任务已提交到边缘节点'
    }
    
    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: error.message || 'Invalid request body for AI generate',
      _edge: { region: env.REGION }
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}

// 2.2 AI图片分析（补充缺失函数）
async function handleAIAnalyze(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      message: 'Only POST method is supported for AI image analyze',
      _edge: { region: env.REGION }
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  try {
    // 模拟图片上传分析（实际项目中可对接阿里云OCR/图像识别API）
    // 注：边缘函数中接收文件可通过FormData解析，此处简化模拟
    const body = await request.json()
    const { file } = body

    if (!file) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'Image file is required for analyze',
        _edge: { region: env.REGION }
      }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    // 模拟图片分析结果（提取食材和菜谱）
    const mockIngredients = ['番茄', '鸡蛋', '食盐', '白砂糖', '食用油']
    const mockRecipe = '番茄炒蛋做法：1. 番茄切块，鸡蛋打散备用；2. 热油下锅，倒入鸡蛋翻炒至凝固盛出；3. 锅中留底油，放入番茄块翻炒出汁；4. 加入少许食盐和白砂糖调味，倒入鸡蛋翻炒均匀即可出锅。'

    const responseData = {
      success: true,
      data: {
        ingredients: mockIngredients,
        recipe: mockRecipe,
        imageInfo: {
          format: 'jpg',
          size: '2.4MB',
          resolution: '1920x1080'
        },
        edgeLocation: getLocationName(env.REGION),
        analyzedAt: new Date().toISOString()
      },
      message: '图片分析完成，已提取食材和菜谱信息'
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: error.message || 'Invalid request for image analyze',
      _edge: { region: env.REGION }
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}

// 2.3 AI菜谱建议（补充缺失函数）
async function handleAISuggest(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      message: 'Only POST method is supported for AI recipe suggest',
      _edge: { region: env.REGION }
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
  
  try {
    const body = await request.json()
    const { ingredients = [], diet = 'normal' } = body

    // 模拟菜谱建议结果
    const mockSuggestions = [
      {
        id: `recipe_${Date.now()}_1`,
        title: `(${ingredients.join(',')}) 快手家常菜`,
        difficulty: 'easy',
        prepTime: 5,
        cookTime: 10,
        likes: 128,
        description: `使用${ingredients.join('和')}制作的快手家常菜，简单美味，适合新手操作`
      },
      {
        id: `recipe_${Date.now()}_2`,
        title: `(${ingredients.join(',')}) 营养减脂餐`,
        difficulty: 'medium',
        prepTime: 8,
        cookTime: 15,
        likes: 256,
        description: `低卡低脂的${ingredients.join('搭配')}食谱，满足减脂期营养需求`
      }
    ]

    const responseData = {
      success: true,
      data: {
        suggestions: mockSuggestions,
        total: mockSuggestions.length,
        edgeLocation: getLocationName(env.REGION),
        suggestedAt: new Date().toISOString()
      },
      message: `为你推荐${mockSuggestions.length}道基于${ingredients.join(',')}的菜谱`
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: error.message || 'Invalid request for recipe suggest',
      _edge: { region: env.REGION }
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}

// 3. 菜谱服务处理（补充缺失函数，完整支持列表/详情/点赞）
async function handleRecipeService(subPath, request, env) {
  // 模拟全局菜谱数据
  const mockRecipes = [
    {
      id: 'recipe_001',
      title: '番茄炒蛋',
      description: '经典国民家常菜，酸甜可口，营养丰富，新手零失败',
      coverImage: 'https://example.com/tomato-egg.jpg',
      difficulty: 'easy',
      prepTime: 5,
      cookTime: 8,
      servings: 2,
      cuisine: 'chinese',
      likes: 120,
      collects: 80,
      views: 500,
      ingredients: [
        { id: 'ing_001', name: '番茄', amount: 2, unit: '个' },
        { id: 'ing_002', name: '鸡蛋', amount: 3, unit: '个' },
        { id: 'ing_003', name: '食盐', amount: 1, unit: '小勺' },
        { id: 'ing_004', name: '白砂糖', amount: 0.5, unit: '小勺' }
      ],
      steps: [
        { id: 'step_001', order: 1, description: '番茄洗净切块，鸡蛋打入碗中打散备用' },
        { id: 'step_002', order: 2, description: '锅中倒入食用油，油温六成热时倒入鸡蛋，翻炒至凝固盛出' },
        { id: 'step_003', order: 3, description: '锅中留底油，放入番茄块翻炒，直至番茄出汁' },
        { id: 'step_004', order: 4, description: '加入食盐和白砂糖调味，倒入炒好的鸡蛋，翻炒均匀即可出锅' }
      ],
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'recipe_002',
      title: '青椒炒肉',
      description: '下饭神器，肉质鲜嫩，青椒爽脆，香辣入味',
      coverImage: 'https://example.com/green-pepper-meat.jpg',
      difficulty: 'medium',
      prepTime: 8,
      cookTime: 10,
      servings: 2,
      cuisine: 'chinese',
      likes: 180,
      collects: 120,
      views: 750,
      ingredients: [
        { id: 'ing_005', name: '猪里脊', amount: 200, unit: '克' },
        { id: 'ing_006', name: '青椒', amount: 2, unit: '个' },
        { id: 'ing_007', name: '生抽', amount: 1, unit: '大勺' },
        { id: 'ing_008', name: '淀粉', amount: 1, unit: '小勺' }
      ],
      steps: [
        { id: 'step_005', order: 1, description: '猪里脊切片，用生抽和淀粉腌制10分钟' },
        { id: 'step_006', order: 2, description: '青椒洗净去籽，切成菱形块备用' },
        { id: 'step_007', order: 3, description: '热油下锅，放入肉片翻炒至变色盛出' },
        { id: 'step_008', order: 4, description: '锅中留底油，放入青椒块翻炒至断生，倒入肉片翻炒均匀，加少许盐调味即可' }
      ],
      createdAt: '2026-01-02T00:00:00Z'
    }
  ]

  // 处理不同子路径
  switch (subPath) {
    // 菜谱列表（支持分页/筛选）
    case '':
    case '/':
      const url = new URL(request.url)
      const page = Number(url.searchParams.get('page')) || 1
      const limit = Number(url.searchParams.get('limit')) || 10
      const cuisine = url.searchParams.get('cuisine') || ''
      const sort = url.searchParams.get('sort') || 'hot'

      // 模拟筛选
      let filteredRecipes = mockRecipes
      if (cuisine && cuisine !== 'all') {
        filteredRecipes = mockRecipes.filter(recipe => recipe.cuisine === cuisine)
      }

      // 模拟排序
      if (sort === 'hot') {
        filteredRecipes.sort((a, b) => b.likes - a.likes)
      } else if (sort === 'new') {
        filteredRecipes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }

      // 模拟分页
      const total = filteredRecipes.length
      const paginatedRecipes = filteredRecipes.slice((page - 1) * limit, page * limit)

      return new Response(JSON.stringify({
        success: true,
        data: {
          data: paginatedRecipes,
          total,
          page,
          limit,
          edgeLocation: getLocationName(env.REGION)
        },
        message: '菜谱列表获取成功'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*'
        }
      })

    // 单个菜谱详情
    case '/recipe_001':
    case '/recipe_002':
      const recipeId = subPath.replace('/', '')
      const targetRecipe = mockRecipes.find(recipe => recipe.id === recipeId)
      if (!targetRecipe) {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: `Recipe with id '${recipeId}' not found`,
          _edge: { region: env.REGION }
        }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
      }
      return new Response(JSON.stringify({
        success: true,
        data: targetRecipe,
        message: '菜谱详情获取成功',
        _edge: { region: env.REGION }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*'
        }
      })

    // 菜谱点赞
    case '/recipe_001/like':
    case '/recipe_002/like':
      const likeRecipeId = subPath.split('/')[1]
      const likeRecipe = mockRecipes.find(recipe => recipe.id === likeRecipeId)
      if (!likeRecipe) {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: `Recipe with id '${likeRecipeId}' not found for like`,
          _edge: { region: env.REGION }
        }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
      }
      // 模拟点赞（自增1）
      likeRecipe.likes += 1
      return new Response(JSON.stringify({
        success: true,
        data: { id: likeRecipeId, likes: likeRecipe.likes },
        message: '菜谱点赞成功',
        _edge: { region: env.REGION }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        }
      })

    // 未知菜谱接口
    default:
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `Recipe service endpoint '/recipes${subPath}' not found`,
        _edge: { region: env.REGION }
      }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
}

// 4. 用户认证服务处理（补充缺失函数，支持登录/获取用户信息）
async function handleAuthService(subPath, request, env) {
  switch (subPath) {
    // 用户登录
    case 'login':
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({
          error: 'Method not allowed',
          message: 'Only POST method is supported for login',
          _edge: { region: env.REGION }
        }), { status: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
      }
      try {
        const body = await request.json()
        const { phone, password } = body

        // 简单校验（实际项目中需对接数据库/阿里云认证服务）
        if (!phone || !password) {
          return new Response(JSON.stringify({
            error: 'Bad Request',
            message: 'Phone and password are required for login',
            _edge: { region: env.REGION }
          }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
        }

        // 模拟登录成功，返回Token和用户信息
        const mockToken = `aliyun_esa_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
        const mockUser = {
          id: `user_${Date.now().toString(36).substr(2, 8)}`,
          username: phone,
          avatar: 'https://example.com/user-avatar.jpg',
          phone,
          joinTime: new Date().toISOString()
        }

        return new Response(JSON.stringify({
          success: true,
          data: {
            token: mockToken,
            user: mockUser
          },
          message: '用户登录成功',
          _edge: { region: env.REGION }
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*'
          }
        })
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Bad Request',
          message: error.message || 'Invalid login request body',
          _edge: { region: env.REGION }
        }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
      }

    // 获取用户信息
    case 'profile':
      if (request.method !== 'GET') {
        return new Response(JSON.stringify({
          error: 'Method not allowed',
          message: 'Only GET method is supported for user profile',
          _edge: { region: env.REGION }
        }), { status: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
      }
      // 模拟从Token解析用户信息（实际项目中需校验Token）
      const token = request.headers.get('Authorization') || ''
      if (!token) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Token is required for user profile',
          _edge: { region: env.REGION }
        }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
      }

      // 模拟用户信息
      const mockProfile = {
        id: 'user_123456',
        username: '美食达人',
        avatar: 'https://example.com/user-avatar.jpg',
        phone: '13800138000',
        likes: 56,
        collects: 32,
        createTime: '2026-01-01T00:00:00Z'
      }

      return new Response(JSON.stringify({
        success: true,
        data: mockProfile,
        message: '用户信息获取成功',
        _edge: { region: env.REGION }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*'
        }
      })

    // 未知认证接口
    default:
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `Auth service endpoint '/auth/${subPath}' not found`,
        _edge: { region: env.REGION }
      }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
}

// 辅助函数：生成唯一请求ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 辅助函数：根据区域编码获取中文地区名称
function getLocationName(region) {
  const locationMap = {
    'cn-hangzhou': '杭州',
    'cn-beijing': '北京',
    'cn-shanghai': '上海',
    'cn-shenzhen': '深圳',
    'cn-hongkong': '香港',
    'us-west-1': '美国西部',
    'eu-central-1': '欧洲中部',
    'ap-southeast-1': '新加坡',
    'ap-northeast-1': '日本东京',
    'ap-southeast-2': '澳大利亚悉尼'
  }
  
  return locationMap[region] || region || '全球边缘节点'
}
