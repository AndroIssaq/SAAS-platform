"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useUnreadNotifications(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const fetchUnreadCount = async () => {
      try {
        console.log("📊 Fetching unread count for user via API:", userId)
        const res = await fetch(`/api/notifications/unread-count?userId=${encodeURIComponent(userId)}`)
        if (!res.ok) {
          console.error("❌ Error fetching unread count (HTTP):", res.status)
          return
        }

        const data: { success: boolean; count?: number } = await res.json()
        if (!data.success) {
          console.error("❌ Error fetching unread count (API):", data)
          return
        }

        setUnreadCount(data.count ?? 0)
      } catch (error) {
        console.error("❌ Error fetching unread count (network):", error)
      }
    }

    // Fetch initial count
    fetchUnreadCount()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔔 Notification change received:", payload)
          // Refetch count when any change happens
          fetchUnreadCount()
        }
      )
      .subscribe((status) => {
        console.log("📡 Notifications subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return unreadCount
}
