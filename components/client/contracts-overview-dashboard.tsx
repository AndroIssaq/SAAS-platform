"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Sparkles,
  CreditCard
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface ContractsOverviewDashboardProps {
  userId: string
}

export function ContractsOverviewDashboard({ userId }: ContractsOverviewDashboardProps) {
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Helper: Check if contract is new (< 48 hours)
  const isNewContract = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 48
  }

  // Fetch contracts
  useEffect(() => {
    const fetchContracts = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("contracts")
        .select("*")
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

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

    const channel = supabase
      .channel(`contracts_overview:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contracts",
          filter: `client_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setContracts((prev) => [payload.new, ...prev.slice(0, 4)])
            
            toast.success("🎉 عقد جديد!", {
              description: `عقد رقم ${payload.new.contract_number}`,
              duration: 10000,
            })
          } else if (payload.eventType === "UPDATE") {
            setContracts((prev) =>
              prev.map((c) => (c.id === payload.new.id ? payload.new : c))
            )
          } else if (payload.eventType === "DELETE") {
            setContracts((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId])

  const pendingContracts = contracts.filter((c) => 
    c.current_step < 8 && c.workflow_status !== 'completed' && c.status !== 'active'
  )
  const completedContracts = contracts.filter((c) => 
    c.current_step === 8 || c.workflow_status === 'completed' || c.status === 'active'
  )
  const awaitingPaymentReview = contracts.filter(
    (c) => c.payment_proof_id && c.current_step === 6 && c.workflow_status !== 'completed'
  )

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            عقودي
          </CardTitle>
          <CardDescription>لا توجد عقود حالياً</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground text-sm">
            ستظهر عقودك هنا بمجرد إنشائها
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Card with Stats */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                عقودي
              </CardTitle>
              <CardDescription className="mt-1">
                لديك {contracts.length} {contracts.length === 1 ? "عقد" : "عقود"}
              </CardDescription>
            </div>
            <Link href="/client/contracts">
              <Button variant="outline" size="sm" className="gap-2">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Clock className="h-5 w-5 text-orange-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-900">{pendingContracts.length}</p>
              <p className="text-xs text-orange-700">قيد الإنجاز</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CreditCard className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-900">{awaitingPaymentReview.length}</p>
              <p className="text-xs text-blue-700">مراجعة الدفع</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-900">{completedContracts.length}</p>
              <p className="text-xs text-green-700">مكتمل</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Contracts - Urgent Actions */}
      {pendingContracts.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              عقود تحتاج إلى إجراء ({pendingContracts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {pendingContracts.slice(0, 3).map((contract, index) => {
                  // Calculate progress based on current_step and workflow_status
                  const progress = contract.workflow_status === 'completed' || contract.status === 'active'
                    ? 100
                    : (contract.current_step / 8) * 100
                  const isNew = isNewContract(contract.created_at)

                  return (
                    <motion.div
                      key={contract.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="bg-white hover:shadow-md transition-all relative overflow-hidden">
                        {isNew && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs">
                              <Sparkles className="w-3 h-3 ml-1" />
                              جديد
                            </Badge>
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">
                                {contract.contract_number}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2">
                                {contract.service_type}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline" className="text-xs">
                                  الخطوة {contract.current_step} من 8
                                </Badge>
                                {contract.payment_proof_id && (
                                  <Badge className="bg-blue-600 text-xs">
                                    قيد مراجعة الدفع
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="text-lg font-bold text-primary">
                                {Number(contract.total_amount).toLocaleString("ar-EG")}
                              </p>
                              <p className="text-xs text-muted-foreground">ج.م</p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">التقدم</span>
                              <span className="text-xs font-semibold">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>

                          {/* Action Button */}
                          <Link href={`/client/contracts/${contract.id}/flow`}>
                            <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                              {contract.current_step === 4 && "رفع بطاقة الهوية"}
                              {contract.current_step === 5 && "تحقق عبر OTP"}
                              {contract.current_step === 6 && "رفع إثبات الدفع"}
                              {![4, 5, 6].includes(contract.current_step) && "متابعة العقد"}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Completed Contracts */}
      {completedContracts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              العقود المكتملة ({completedContracts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedContracts.slice(0, 2).map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-4 w-4 text-green-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{contract.contract_number}</p>
                      <p className="text-xs text-muted-foreground">{contract.service_type}</p>
                    </div>
                  </div>
                  <Link href={`/client/contracts/${contract.id}/flow`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      عرض
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
