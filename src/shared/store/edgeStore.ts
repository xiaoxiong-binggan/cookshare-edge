import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EdgeInfo, AppState, User } from '../types'

interface EdgeStore extends AppState {
  setOnlineStatus: (isOnline: boolean) => void
  setEdgeInfo: (info: Partial<EdgeInfo>) => void
  setUser: (user: User | null) => void
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}

const useEdgeStore = create<EdgeStore>()(
  persist(
    (set, get) => ({
      isOnline: navigator.onLine,
      edgeInfo: {
        location: '检测中...',
        latency: 0,
        region: 'global',
        cacheHit: 0,
        lastUpdated: new Date().toISOString()
      },
      user: null,
      notifications: [],
      
      setOnlineStatus: (isOnline) => set({ isOnline }),
      
      setEdgeInfo: (info) => set((state) => ({
        edgeInfo: {
          ...state.edgeInfo,
          ...info,
          lastUpdated: new Date().toISOString()
        }
      })),
      
      setUser: (user) => set({ user }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            read: false,
            ...notification
          },
          ...state.notifications
        ]
      })),
      
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      })),
      
      clearNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'edge-store',
      partialize: (state) => ({
        user: state.user,
        edgeInfo: state.edgeInfo
      })
    }
  )
)

export default useEdgeStore
