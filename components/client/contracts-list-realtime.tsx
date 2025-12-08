"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Calendar, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import { toast } from "sonner"
import Link from "next/link"

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending_client_signature: "بانتظار التوقيع",
  pending_admin_signature: "بانتظار توقيع المدير",
  pending_payment: "بانتظار الدفع",
  active: "نشط",
  completed: "مكتمل",
  cancelled: "ملغي",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_client_signature: "bg-yellow-100 text-yellow-800",
  pending_admin_signature: "bg-blue-100 text-blue-800",
  pending_payment: "bg-orange-100 text-orange-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
}

interface ContractsListRealtimeProps {
  initialContracts: any[]
  userId: string
}

export function ContractsListRealtime({ initialContracts, userId }: ContractsListRealtimeProps) {
  const [contracts, setContracts] = useState(initialContracts)

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    console.log("🔌 Setting up Real-time subscription for user:", userId)

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`client_contracts:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contracts",
          filter: `client_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔔 Contract Real-time Update:", payload)
          
          if (payload.eventType === "INSERT") {
            console.log("✅ New contract added:", payload.new)
            setContracts(prev => [payload.new, ...prev])
            
            // Show notification
            toast.success("عقد جديد في انتظار توقيعك!", {
              description: `عقد رقم ${payload.new.contract_number}`,
              duration: 10000,
            })
            
            // Browser notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("عقد جديد في انتظارك", {
                body: `عقد رقم ${payload.new.contract_number} - يرجى المراجعة والتوقيع`,
                icon: "/logo.png"
              })
            }
          } else if (payload.eventType === "UPDATE") {
            console.log("🔄 Contract updated:", payload.new)
            setContracts(prev =>
              prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c)
            )
          } else if (payload.eventType === "DELETE") {
            console.log("🗑️ Contract deleted:", payload.old)
            setContracts(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Subscription status:", status)
      })

    return () => {
      console.log("🔌 Unsubscribing from Real-time")
      channel.unsubscribe()
    }
  }, [userId])

  const pendingContracts = contracts.filter(c => 
    c.current_step < 8 && c.workflow_status === "pending_client_signature"
  )

  const awaitingPaymentProof = contracts.filter(c =>
    c.current_step === 6 && c.payment_proof_url && !c.payment_proof_verified
  )

  return (
    <div className="space-y-6">
      {/* Pending Contracts Alert */}
      {pendingContracts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>عقود في انتظار توقيعك ({pendingContracts.length})</strong>
            <div className="mt-2 space-y-2">
              {pendingContracts.map(contract => (
                <div key={contract.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-semibold">{contract.contract_number}</p>
                    <p className="text-sm text-muted-foreground">
                      الخطوة {contract.current_step} من 8
                    </p>
                  </div>
                  <Link href={`/client/contracts/${contract.id}/flow`}>
                    <Button size="sm">
                      متابعة العقد
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Proof Under Review */}
      {awaitingPaymentProof.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>إثبات الدفع قيد المراجعة</strong>
            <p className="text-sm mt-1">
              تم رفع إثبات الدفع بنجاح. سيتم إشعارك فور الموافقة عليه من قبل الإدارة.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* All Contracts */}
      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد عقود حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {contracts.map((contract: any) => {
            const isCompleted = contract.current_step === 8
            const isPending = contract.current_step < 8

            return (
              <Card key={contract.id} className={isPending ? "border-l-4 border-l-orange-500" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {contract.contract_number}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {contract.service_type}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={statusColors[contract.status] || "bg-gray-100"}>
                        {statusLabels[contract.status] || contract.status}
                      </Badge>
                      {isPending && (
                        <Badge variant="outline" className="text-xs">
                          الخطوة {contract.current_step} من 8
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-green-600">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          مكتمل
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">المبلغ الإجمالي</p>
                        <p className="font-semibold">{Number(contract.total_amount).toLocaleString("ar-EG")} ج.م</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">العربون</p>
                        <p className="font-semibold">{Number(contract.deposit_amount).toLocaleString("ar-EG")} ج.م</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">تاريخ الإنشاء</p>
                        <p className="font-semibold">{formatDate(contract.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Status Indicators */}
                  {isPending && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-muted-foreground mb-1">بطاقة الهوية</p>
                          <Badge variant={contract.step_4_completed ? "default" : "secondary"} className="text-xs">
                            {contract.step_4_completed ? "تم" : "معلق"}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground mb-1">التحقق</p>
                          <Badge variant={contract.step_5_completed ? "default" : "secondary"} className="text-xs">
                            {contract.step_5_completed ? "تم" : "معلق"}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground mb-1">الدفع</p>
                          <Badge variant={contract.step_6_completed ? "default" : "secondary"} className="text-xs">
                            {contract.step_6_completed ? "تم" : "معلق"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/client/contracts/${contract.id}/flow`}>
                        عرض التفاصيل
                      </Link>
                    </Button>
                    
                    {isPending && (
                      <Button size="sm" asChild>
                        <Link href={`/client/contracts/${contract.id}/flow`}>
                          متابعة العقد
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
