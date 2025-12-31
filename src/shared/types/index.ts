// 菜谱相关类型
export interface Recipe {
  id: string
  title: string
  description: string
  coverImage: string
  difficulty: 'easy' | 'medium' | 'hard'
  prepTime: number // 分钟
  cookTime: number // 分钟
  servings: number
  cost: number
  tags: string[]
  cuisine: string
  ingredients: Ingredient[]
  steps: RecipeStep[]
  author: User
  likes: number
  collects: number
  views: number
  createdAt: string
  updatedAt: string
  videoUrl?: string
}

export interface Ingredient {
  id: string
  name: string
  amount: number
  unit: string
  note?: string
}

export interface RecipeStep {
  id: string
  order: number
  description: string
  image?: string
  video?: string
  time?: number // 秒
  tip?: string
}

export interface User {
  id: string
  username: string
  avatar: string
  level: number
  bio?: string
}

// AI生成相关
export interface VideoGenerationOptions {
  style: 'anime' | 'comic' | 'watercolor' | 'realistic'
  music: 'upbeat' | 'relax' | 'kitchen' | 'none'
  speed: 'slow' | 'normal' | 'fast'
  voice: boolean
  subtitles: 'zh' | 'en' | 'jp' | 'none'
  resolution: '720p' | '1080p' | '4k'
}

export interface GenerationTask {
  id: string
  recipeId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  resultUrl?: string
  estimatedTime?: number
  edgeLocation?: string
  createdAt: string
}

// 边缘计算相关
export interface EdgeInfo {
  location: string
  latency: number
  region: string
  cacheHit: number
  lastUpdated: string
}

// 实时协作相关
export interface CollabUser {
  id: string
  username: string
  avatar: string
  cursorPosition?: { x: number; y: number }
  lastActive: string
}

export interface CollabMessage {
  id: string
  userId: string
  content: string
  type: 'text' | 'image' | 'system'
  createdAt: string
}

// 应用状态
export interface AppState {
  isOnline: boolean
  edgeInfo: EdgeInfo
  user: User | null
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: string
}
