"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"

export function useMessages() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch initial messages
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })

      if (data) {
        setMessages(data)
        // Count unread messages
        const unread = data.filter(m => m.receiver_id === user.id && !m.is_read).length
        setUnreadCount(unread)
      }
      setLoading(false)

      // Setup real-time subscription
      channel = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`,
          },
          async (payload) => {
            if (payload.eventType === "INSERT") {
              // Add new message
              const newMessage = payload.new
              setMessages((prev) => [newMessage, ...prev])
              
              // Update unread count if it's for current user
              if (newMessage.receiver_id === user.id && !newMessage.is_read) {
                setUnreadCount((prev) => prev + 1)
              }
            } else if (payload.eventType === "UPDATE") {
              // Update existing message
              setMessages((prev) =>
                prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
              )
              
              // Update unread count if message was marked as read
              if (payload.new.receiver_id === user.id && payload.new.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1))
              }
            } else if (payload.eventType === "DELETE") {
              // Remove deleted message
              setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
            }
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  return { messages, loading, unreadCount }
}
