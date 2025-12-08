import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Notification Interface
 */
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link?: string
  related_id?: string
  read: boolean
  read_at?: string
  status: string
  data?: any
  created_at: string
}

/**
 * Notifications State Interface
 */
export interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  realtimeChannel: RealtimeChannel | null

  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => void
  setUnreadCount: (count: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Fetch operations
  fetchNotifications: (userId: string) => Promise<void>
  fetchUnreadCount: (userId: string) => Promise<void>

  // Realtime subscription
  subscribeToNotifications: (userId: string) => void
  unsubscribeFromNotifications: () => void

  // Reset
  reset: () => void
}

/**
 * Notifications Store
 * Manages notifications with realtime updates
 */
export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  realtimeChannel: null,

  // Setters
  setNotifications: (notifications) => set({ notifications }),
  
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: !notification.read ? state.unreadCount + 1 : state.unreadCount
    }))
  },

  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }))
  },

  setUnreadCount: (count) => set({ unreadCount: count }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  /**
   * Fetch user notifications
   */
  fetchNotifications: async (userId: string) => {
    set({ isLoading: true, error: null })

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      set({
        notifications: data || [],
        isLoading: false
      })

      // Also fetch unread count
      await get().fetchUnreadCount(userId)
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      set({
        error: error.message || 'فشل في جلب الإشعارات',
        isLoading: false
      })
    }
  },

  /**
   * Fetch unread notifications count
   */
  fetchUnreadCount: async (userId: string) => {
    try {
      const supabase = createClient()
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error

      set({ unreadCount: count || 0 })
    } catch (error: any) {
      console.error('Error fetching unread count:', error)
    }
  },

  /**
   * Subscribe to realtime notifications
   */
  subscribeToNotifications: (userId: string) => {
    const supabase = createClient()

    // Unsubscribe from previous channel if exists
    get().unsubscribeFromNotifications()

    console.log('🔔 Subscribing to notifications realtime:', userId)

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 Notification realtime update:', payload)

          if (payload.eventType === 'INSERT') {
            // New notification
            get().addNotification(payload.new as Notification)

            // Show browser notification if permitted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification(payload.new.title, {
                body: payload.new.message,
                icon: '/logo.png',
                tag: payload.new.id
              })

              notification.onclick = () => {
                if (payload.new.link) {
                  window.location.href = payload.new.link
                }
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            // Notification updated (e.g., marked as read)
            set((state) => ({
              notifications: state.notifications.map((n) =>
                n.id === payload.new.id ? (payload.new as Notification) : n
              )
            }))
          } else if (payload.eventType === 'DELETE') {
            // Notification deleted
            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== payload.old.id)
            }))
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Notifications subscription status:', status)
      })

    set({ realtimeChannel: channel })
  },

  /**
   * Unsubscribe from realtime notifications
   */
  unsubscribeFromNotifications: () => {
    const channel = get().realtimeChannel
    if (channel) {
      console.log('🔌 Unsubscribing from notifications realtime')
      channel.unsubscribe()
      set({ realtimeChannel: null })
    }
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    get().unsubscribeFromNotifications()
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      realtimeChannel: null
    })
  }
}))
