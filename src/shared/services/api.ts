import axios from 'axios'
import type { Recipe, VideoGenerationOptions, GenerationTask } from '../types'

const API_BASE_URL = import.meta.env.PROD 
  ? '' // 生产环境使用相对路径
  : 'http://localhost:8787'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 边缘计算允许更长超时
  headers: {
    'Content-Type': 'application/json',
    'X-Edge-Client': 'cookshare-web'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加边缘计算相关头
    config.headers['X-Edge-Region'] = localStorage.getItem('edge_region') || 'auto'
    config.headers['X-Edge-Cache'] = 'true'
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 记录边缘信息
    const edgeLocation = response.headers['x-edge-location']
    const cacheStatus = response.headers['x-edge-cache']
    
    if (edgeLocation) {
      localStorage.setItem('last_edge_location', edgeLocation)
    }
    
    if (cacheStatus === 'HIT') {
      console.log('边缘缓存命中:', response.config.url)
    }
    
    return response.data
  },
  async (error) => {
    // 边缘计算容错处理
    if (error.code === 'ECONNABORTED') {
      console.warn('请求超时，尝试使用缓存或降级方案')
      
      // 尝试从缓存获取
      if (typeof caches !== 'undefined') {
        const cache = await caches.open('api-fallback')
        const cachedResponse = await cache.match(error.config.url)
        
        if (cachedResponse) {
          console.log('使用缓存数据作为降级方案')
          return cachedResponse.json()
        }
      }
    }
    
    // 统一错误处理
    const message = error.response?.data?.message || error.message || '请求失败'
    
    // 触发全局通知
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-error', { 
        detail: { message, config: error.config }
      }))
    }
    
    return Promise.reject(error)
  }
)

// 菜谱服务
export const recipeService = {
  getRecipes: (params?: {
    page?: number
    limit?: number
    cuisine?: string
    difficulty?: string
    maxTime?: number
    sort?: 'new' | 'hot' | 'trending'
  }) => api.get<{ data: Recipe[]; total: number; page: number }>('/api/recipes', { params }),
  
  getRecipeById: (id: string) => api.get<{ data: Recipe }>(`/api/recipes/${id}`),
  
  createRecipe: (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'author'>) => 
    api.post<{ data: Recipe; message: string }>('/api/recipes', data),
  
  updateRecipe: (id: string, data: Partial<Recipe>) => 
    api.put<{ data: Recipe }>(`/api/recipes/${id}`, data),
  
  likeRecipe: (id: string) => api.post(`/api/recipes/${id}/like`),
  
  collectRecipe: (id: string) => api.post(`/api/recipes/${id}/collect`),
}

// AI生成服务
export const aiService = {
  generateVideo: (recipeId: string, options: VideoGenerationOptions) => 
    api.post<{ data: GenerationTask; message: string }>('/api/ai/generate', { recipeId, options }),
  
  getGenerationStatus: (taskId: string) => 
    api.get<{ data: GenerationTask }>(`/api/ai/status/${taskId}`),
  
  getGeneratedVideos: (params?: { page?: number; limit?: number }) => 
    api.get<{ data: GenerationTask[] }>('/api/ai/videos', { params }),
  
  analyzeImage: (imageFile: File) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    return api.post<{ data: { ingredients: string[]; recipe: string } }>('/api/ai/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  suggestRecipes: (ingredients: string[]) => 
    api.post<{ data: Recipe[] }>('/api/ai/suggest', { ingredients }),
}

// 边缘信息服务
export const edgeService = {
  getEdgeInfo: () => api.get<{ data: EdgeInfo }>('/api/edge-info'),
  
  getEdgeStats: () => api.get<{ data: any }>('/api/edge-stats'),
  
  clearEdgeCache: (path?: string) => 
    api.post('/api/edge-cache/clear', { path }),
  
  getEdgeLocations: () => 
    api.get<{ data: Array<{ location: string; latency: number }> }>('/api/edge-locations'),
}

// 用户服务
export const userService = {
  login: (phone: string, code: string) => 
    api.post<{ data: { token: string; user: User } }>('/api/auth/login', { phone, code }),
  
  register: (data: { phone: string; username: string; password: string }) => 
    api.post('/api/auth/register', data),
  
  getProfile: () => api.get<{ data: User }>('/api/auth/profile'),
  
  updateProfile: (data: Partial<User>) => 
    api.put<{ data: User }>('/api/auth/profile', data),
}

export default api
