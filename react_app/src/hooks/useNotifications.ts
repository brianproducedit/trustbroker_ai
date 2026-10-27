import { create } from 'zustand'

export interface AppNotification {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'contract' | 'payment' | 'verification' | 'revision' | 'system'
  read: boolean
  link?: string
}

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: () => number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    title: 'Milestone 1 Payment Released',
    description: '$1,200 USD paid to the freelancer for TB-2026-084.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'payment',
    read: false,
    link: '/dashboard/contracts/contract-1',
  },
  {
    id: 'n-2',
    title: 'Verification Passed (98%)',
    description: 'AI verification completed for TB-2026-084 Architecture milestone.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: 'verification',
    read: false,
    link: '/dashboard/contracts/contract-1',
  },
  {
    id: 'n-3',
    title: 'Terms Accepted by Client',
    description: 'The client accepted the contract scope.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    type: 'contract',
    read: true,
    link: '/dashboard/contracts/contract-1',
  },
]

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: INITIAL_NOTIFICATIONS,

  unreadCount: () => {
    return get().notifications.filter((n) => !n.read).length
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
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
