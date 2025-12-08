"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface ContractRealtimeData {
  id: string
  current_step: number
  status: string
  workflow_status: string
  payment_proof_url: string | null
  payment_proof_verified: boolean
  step_4_completed: boolean
  step_5_completed: boolean
  step_6_completed: boolean
}

export function useContractRealtime(contractId: string | null) {
  const [contract, setContract] = useState<ContractRealtimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!contractId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Initial fetch
    const fetchContract = async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, current_step, status, workflow_status, payment_proof_url, payment_proof_verified, step_4_completed, step_5_completed, step_6_completed")
        .eq("id", contractId)
        .single()

      if (data && !error) {
        setContract(data)
      }
      setLoading(false)
    }

    fetchContract()

    // Subscribe to real-time updates
    const realtimeChannel = supabase
      .channel(`contract:${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contracts",
          filter: `id=eq.${contractId}`,
        },
        (payload) => {
          console.log("Contract updated in real-time:", payload)
          setContract(payload.new as ContractRealtimeData)
        }
      )
      .subscribe()

    setChannel(realtimeChannel)

    // Cleanup
    return () => {
      realtimeChannel.unsubscribe()
    }
  }, [contractId])

  return { contract, loading, channel }
}

export function useContractNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Initial fetch
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("contract_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (data && !error) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
      setLoading(false)
    }

    fetchNotifications()

    // Subscribe to real-time notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contract_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("New notification:", payload)
          setNotifications(prev => [payload.new, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Show browser notification if permitted
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: "/logo.png"
            })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contract_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          )
          if (payload.new.read && !payload.old.read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      channel.unsubscribe()
    }
  }, [userId])

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient()
    await supabase
      .from("contract_notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    await supabase
      .from("contract_notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("read", false)
    
    setUnreadCount(0)
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
