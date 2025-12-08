"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useContractRealtime } from "@/hooks/use-contract-realtime"
import { PaymentProofReview } from "@/components/admin/payment-proof-review"
import { ContractStepperRealtime } from "@/components/contracts/contract-stepper-realtime"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AffiliateContractReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [contractData, setContractData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { contract } = useContractRealtime(params.id)

  useEffect(() => {
    const fetchContract = async () => {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Get contract
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", params.id)
        .eq("affiliate_id", user.id) // Ensure affiliate owns this contract
        .single()
      
      if (error || !data) {
        toast.error("العقد غير موجود أو ليس لديك صلاحية للوصول إليه")
        router.push("/affiliate/contracts")
        return
      }

      setContractData(data)
      setLoading(false)
    }

    fetchContract()
  }, [params.id, router])

  // Real-time updates
  useEffect(() => {
    if (contract) {
      setContractData(prev => ({ ...prev, ...contract }))
    }
  }, [contract])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!contractData) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>العقد غير موجود</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isPaymentProofPending = contractData.payment_proof_url && !contractData.payment_proof_verified
  const isPaymentProofApproved = contractData.payment_proof_verified

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مراجعة العقد</h1>
          <p className="text-muted-foreground mt-1">
            {contractData.contract_number}
          </p>
        </div>
        <Badge variant={contractData.current_step === 8 ? "default" : "secondary"}>
          الخطوة {contractData.current_step} من 8
        </Badge>
      </div>

      {/* Real-time Stepper */}
      <ContractStepperRealtime 
        contractId={contractData.id} 
        initialStep={contractData.current_step}
        userRole="affiliate"
      />

      {/* Real-time Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>حالة العقد - تحديث فوري</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">بطاقة الهوية</p>
              {contractData.step_4_completed ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  تم الرفع
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 ml-1" />
                  في الانتظار
                </Badge>
              )}
            </div>

            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">التحقق من الهوية</p>
              {contractData.step_5_completed ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  تم التحقق
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 ml-1" />
                  في الانتظار
                </Badge>
              )}
            </div>

            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">إثبات الدفع</p>
              {contractData.step_6_completed ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  تم الرفع
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 ml-1" />
                  في الانتظار
                </Badge>
              )}
            </div>

            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">الموافقة</p>
              {isPaymentProofApproved ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  تمت الموافقة
                </Badge>
              ) : isPaymentProofPending ? (
                <Badge className="bg-orange-600">
                  <AlertCircle className="w-3 h-3 ml-1" />
                  قيد المراجعة
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 ml-1" />
                  في الانتظار
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات العقد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">اسم العميل</p>
              <p className="font-semibold">{contractData.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              <p className="font-semibold">{contractData.client_email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نوع الخدمة</p>
              <p className="font-semibold">{contractData.service_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
              <p className="font-semibold text-lg">
                {parseFloat(contractData.total_amount).toLocaleString('ar-EG')} ج.م
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Proof Review */}
      {isPaymentProofPending && (
        <PaymentProofReview
          contractId={contractData.id}
          contractNumber={contractData.contract_number}
          clientName={contractData.client_name}
          clientId={contractData.client_id}
          clientEmail={contractData.client_email}
          paymentProofUrl={contractData.payment_proof_url}
          totalAmount={parseFloat(contractData.total_amount)}
          depositAmount={parseFloat(contractData.deposit_amount)}
          onApprove={() => {
            toast.success("تم قبول إثبات الدفع!")
            router.push("/affiliate/contracts")
          }}
          onReject={() => {
            toast.success("تم رفض إثبات الدفع")
            router.push("/affiliate/contracts")
          }}
        />
      )}

      {/* Already Approved */}
      {isPaymentProofApproved && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>تمت الموافقة على إثبات الدفع</strong>
            <p className="text-sm mt-1">
              تم قبول إثبات الدفع وانتقل العقد إلى المرحلة النهائية.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Waiting for Payment Proof */}
      {!contractData.payment_proof_url && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>في انتظار رفع إثبات الدفع</strong>
            <p className="text-sm mt-1">
              العميل لم يقم برفع إثبات الدفع بعد. سيتم إشعارك فور رفعه.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
