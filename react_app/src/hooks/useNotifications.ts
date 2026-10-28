import { create } from 'zustand'
import { api } from '@/lib/api'

export interface AppNotification {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'contract' | 'payment' | 'verification' | 'revision' | 'system' | 'application'
  read: boolean
  link?: string
}

interface NotificationStore {
  notifications: AppNotification[]
  isLoading: boolean
  unreadCount: () => number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    title: 'Milestone 1 Payment Released',
    description: '$4,000.00 USD sent to registered PayPal email for TB-2026-001.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'payment',
    read: false,
    link: '/dashboard/contracts/TB-2026-001',
  },
  {
    id: 'n-2',
    title: 'Verification Passed (94%)',
    description: 'Groq LPU verified deliverables for Storefront & Cart Checkout Integration.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: 'verification',
    read: false,
    link: '/dashboard/contracts/TB-2026-001',
  },
  {
    id: 'n-3',
    title: 'New Application Received',
    description: 'Tariro Moyo submitted an application for TB-2026-002 (AI Match: 92%).',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    type: 'application',
    read: true,
    link: '/app/client/dashboard',
  },
]

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: INITIAL_NOTIFICATIONS,
  isLoading: false,

  unreadCount: () => {
    return get().notifications.filter((n) => !n.read).length
  },

  fetchNotifications: async () => {
    try {
      set({ isLoading: true })
      const res = await api.notifications.list({ per_page: 50 })
      if (res && res.notifications && res.notifications.length > 0) {
        const mapped: AppNotification[] = res.notifications.map((n: any) => ({
          id: n.id,
          title: n.title,
          description: n.body,
          timestamp: n.created_at,
          type: (n.type?.includes('payment') ? 'payment' : n.type?.includes('verification') ? 'verification' : 'contract') as any,
          read: Boolean(n.read_at),
          link: n.entity_type === 'contract' ? `/dashboard/contracts/${n.entity_id || 'TB-2026-001'}` : undefined,
        }))
        set({ notifications: mapped })
      }
    } catch {
      // In offline / mock mode, keep fallback initial notifications
    } finally {
      set({ isLoading: false })
    }
  },

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
    try {
      if (!id.startsWith('n-') && !id.startsWith('notif-')) {
        await api.notifications.markRead(id)
      }
    } catch {
      // Non-blocking
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
    try {
      await api.notifications.markAllRead()
    } catch {
      // Non-blocking
    }
  },

  addNotification: (n) => {
    const newNotif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }))
  },
}))
