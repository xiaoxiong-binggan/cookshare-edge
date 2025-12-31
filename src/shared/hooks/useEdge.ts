import { useEffect, useState } from 'react'
import useEdgeStore from '../store/edgeStore'
import { edgeService } from '../services/api'

interface UseEdgeOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useEdge(options: UseEdgeOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { edgeInfo, setEdgeInfo, isOnline } = useEdgeStore()

  const refreshEdgeInfo = async () => {
    if (!isOnline) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await edgeService.getEdgeInfo()
      setEdgeInfo(response.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取边缘信息失败'))
      console.error('Failed to fetch edge info:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshEdgeInfo()
    
    if (autoRefresh) {
      const interval = setInterval(refreshEdgeInfo, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [isOnline, autoRefresh, refreshInterval])

  const clearCache = async (path?: string) => {
    try {
      await edgeService.clearEdgeCache(path)
      return true
    } catch (err) {
      console.error('Failed to clear cache:', err)
      return false
    }
  }

  const getNearestEdge = async () => {
    try {
      const response = await edgeService.getEdgeLocations()
      return response.data.sort((a, b) => a.latency - b.latency)[0]
    } catch (err) {
      console.error('Failed to get edge locations:', err)
      return null
    }
  }

  return {
    edgeInfo,
    loading,
    error,
    refreshEdgeInfo,
    clearCache,
    getNearestEdge,
    isOnline
  }
}

export function useEdgeCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number // 缓存时间（毫秒）
    enabled?: boolean
  }
) {
  const { ttl = 5 * 60 * 1000, enabled = true } = options || {}
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadData = async (force = false) => {
    if (!enabled) return
    
    try {
      setLoading(true)
      setError(null)

      // 尝试从缓存获取
      if (!force) {
        const cached = localStorage.getItem(`edge_cache_${key}`)
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached)
          
          if (Date.now() - timestamp < ttl) {
            setData(cachedData)
            setLoading(false)
            return
          }
        }
      }

      // 获取新数据
      const newData = await fetcher()
      setData(newData)
      
      // 缓存到本地
      localStorage.setItem(
        `edge_cache_${key}`,
        JSON.stringify({
          data: newData,
          timestamp: Date.now()
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取数据失败'))
      console.error(`Failed to fetch data for key ${key}:`, err)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = () => {
    localStorage.removeItem(`edge_cache_${key}`)
    setData(null)
  }

  useEffect(() => {
    loadData()
  }, [key, enabled])

  return {
    data,
    loading,
    error,
    refresh: () => loadData(true),
    clearCache
  }
}
