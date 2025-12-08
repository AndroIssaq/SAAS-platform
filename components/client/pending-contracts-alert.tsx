"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, AlertCircle, Sparkles } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

interface PendingContractsAlertProps {
  userId: string
  initialContracts?: any[]
}

export function PendingContractsAlert({ userId, initialContracts = [] }: PendingContractsAlertProps) {
  const [contracts, setContracts] = useState(initialContracts)
  const [loading, setLoading] = useState(true)

  // Helper: Check if contract is new (< 24 hours)
  const isNewContract = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Fetch initial contracts
  useEffect(() => {
    const fetchContracts = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("contracts")
        .select("*")
        .eq("client_id", userId)
        .lt("current_step", 8)
        .order("created_at", { ascending: false })

      if (data) {
        setContracts(data)
      }
      setLoading(false)
    }

    fetchContracts()
  }, [userId])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()

    console.log("🔔 Setting up contract alerts for user:", userId)

    const channel = supabase
      .channel(`pending_contracts:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contracts",
          filter: `client_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔔 Contract alert update:", payload)

          if (payload.eventType === "INSERT") {
            console.log("✅ New contract detected!")
            setContracts(prev => [payload.new, ...prev])

            // Show toast
            toast.success("🎉 عقد جديد في انتظارك!", {
              description: `عقد رقم ${payload.new.contract_number} - يرجى المراجعة والتوقيع`,
              duration: 15000,
              action: {
                label: "عرض العقد",
                onClick: () => window.location.href = `/client/contracts/${payload.new.id}`
              }
            })

            // Browser notification
            if ("Notification" in window && Notification.permission === "granted") {
              const notification = new Notification("عقد جديد في انتظارك! 📄", {
                body: `عقد رقم ${payload.new.contract_number} - اضغط للمراجعة`,
                icon: "/logo.png",
                badge: "/logo.png",
                tag: `contract-${payload.new.id}`,
                requireInteraction: true
              })

              notification.onclick = () => {
                window.focus()
                window.location.href = `/client/contracts/${payload.new.id}`
              }
            }
          } else if (payload.eventType === "UPDATE") {
            setContracts(prev =>
              prev.map(c => c.id === payload.new.id ? payload.new : c)
            )
          } else if (payload.eventType === "DELETE") {
            setContracts(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Contract alerts subscription:", status)
      })

    return () => {
      console.log("🔌 Unsubscribing from contract alerts")
      channel.unsubscribe()
    }
  }, [userId])

  const pendingContracts = contracts.filter(c => c.current_step < 8)

  if (loading) {
    return null
  }

  if (pendingContracts.length === 0) {
    return null
  }

  return (
    <Alert className="border-orange-500 bg-orange-50 mb-6">
      <AlertCircle className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-orange-900 font-bold text-lg">
        عقود في انتظار توقيعك ({pendingContracts.length})
      </AlertTitle>
      <AlertDescription className="mt-3 space-y-3">
        <AnimatePresence>
          {pendingContracts.map((contract, index) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
              {/* New badge indicator */}
              {isNewContract(contract.created_at) && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs animate-pulse">
                    <Sparkles className="w-3 h-3 ml-1" />
                    جديد
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{contract.contract_number}</p>
                  <p className="text-sm text-gray-600">{contract.service_type}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 ml-1" />
                      الخطوة {contract.current_step} من 8
                    </Badge>
                    {contract.payment_proof_id && (
                      <Badge className="bg-blue-600 text-xs">
                        إثبات الدفع: قيد المراجعة
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Link href={`/client/contracts/${contract.id}`}>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  متابعة العقد
                </Button>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div className="pt-2">
          <Link href="/client/contracts">
            <Button variant="outline" size="sm" className="w-full">
              عرض جميع العقود
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}
