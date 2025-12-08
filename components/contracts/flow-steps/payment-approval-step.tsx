"use client"

/**
 * Payment Approval Step - Step 6
 * Admin reviews and approves/rejects payment proof
 * This step is ONLY for approval - not for uploading
 */

import { useState, useEffect } from "react"
import { useContractFlowStore } from "@/lib/stores/contract-flow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"
import type { ParticipantRole } from "@/lib/contract-flow/flow-state-machine"
import { createClient } from "@/lib/supabase/client"

interface PaymentApprovalStepProps {
  contractId: string
  participant: ParticipantRole
  contractData: any
  stepState: any
}

export function PaymentApprovalStep({
  contractId,
  participant,
  contractData,
  stepState,
}: PaymentApprovalStepProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { performAction } = useContractFlowStore()
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null)

  // State for payment proof - can be from contractData or fetched directly
  const [paymentProof, setPaymentProof] = useState<any>(contractData.payment_proof || null)
  const [paymentProofId, setPaymentProofId] = useState<string | null>(contractData.payment_proof_id || null)

  // Fetch payment proof directly from database if not in contractData
  useEffect(() => {
    const fetchPaymentProof = async () => {
      // If already have payment proof, just fetch signed URL
      if (paymentProof?.proof_image_path) {
        const supabase = createClient()
        const { data } = await supabase.storage
          .from('payment-proofs')
          .createSignedUrl(paymentProof.proof_image_path, 3600)

        if (data?.signedUrl) {
          setSignedImageUrl(data.signedUrl)
        }
        return
      }

      // If have payment_proof_id but no proof object, fetch it
      if (paymentProofId && !paymentProof) {
        const supabase = createClient()
        const { data } = await supabase
          .from('payment_proofs')
          .select('*')
          .eq('id', paymentProofId)
          .single()

        if (data) {
          setPaymentProof(data)
          if (data.proof_image_path) {
            const { data: signedData } = await supabase.storage
              .from('payment-proofs')
              .createSignedUrl(data.proof_image_path, 3600)
            if (signedData?.signedUrl) {
              setSignedImageUrl(signedData.signedUrl)
            }
          } else if (data.proof_image_url) {
            setSignedImageUrl(data.proof_image_url)
          }
        }
        return
      }

      // If no payment proof in contract data, try to fetch latest one for this contract
      if (!paymentProof && !paymentProofId) {
        const supabase = createClient()
        const { data } = await supabase
          .from('payment_proofs')
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (data) {
          console.log('[PaymentApprovalStep] Found payment proof from DB:', data.id)
          setPaymentProof(data)
          setPaymentProofId(data.id)

          if (data.proof_image_path) {
            const { data: signedData } = await supabase.storage
              .from('payment-proofs')
              .createSignedUrl(data.proof_image_path, 3600)
            if (signedData?.signedUrl) {
              setSignedImageUrl(signedData.signedUrl)
            }
          } else if (data.proof_image_url) {
            setSignedImageUrl(data.proof_image_url)
          }
        }
      }
    }

    fetchPaymentProof()
  }, [contractId, contractData.payment_proof, paymentProofId, paymentProof])

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setPaymentProof(data)
        setPaymentProofId(data.id)

        if (data.proof_image_path) {
          const { data: signedData } = await supabase.storage
            .from('payment-proofs')
            .createSignedUrl(data.proof_image_path, 3600)
          if (signedData?.signedUrl) {
            setSignedImageUrl(signedData.signedUrl)
          }
        }
      }
    } catch (e) {
      console.error('Refresh error:', e)
    } finally {
      setIsRefreshing(false)
    }
  }

  const isApproved = stepState.adminCompleted

  // Calculate hasPaymentProof from state
  const paymentProofUrl = paymentProof?.proof_image_url || paymentProof?.proof_image_path || signedImageUrl || null
  const hasPaymentProof = !!(paymentProofId || paymentProofUrl || paymentProof)

  // Debug log
  useEffect(() => {
    console.log('[PaymentApprovalStep] Debug:', {
      paymentProofId,
      hasPaymentProof,
      paymentProof,
      signedImageUrl,
    })
  }, [paymentProofId, hasPaymentProof, paymentProof, signedImageUrl])

  // Client view
  if (participant === 'client') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⏳ مراجعة الدفع
            {isApproved && (
              <Badge className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                تمت الموافقة
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isApproved ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                ✅ تمت الموافقة على إثبات الدفع من قبل المدير
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-blue-50 border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                ⏳ إثبات الدفع قيد المراجعة من قبل المدير...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // Admin view - Already approved
  if (isApproved) {
    return (
      <Card className="border-2 border-green-500 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle2 className="h-6 w-6" />
            تمت الموافقة على الدفع!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-background dark:bg-card border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              تمت الموافقة على إثبات الدفع. يمكنك الآن المتابعة لإتمام العقد.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Admin view - No payment proof yet - Show clearer message with refresh
  if (!hasPaymentProof) {
    return (
      <Card className="border-2 border-amber-500/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-amber-500" />
                في انتظار إثبات الدفع
              </CardTitle>
              <CardDescription>
                لم يتم العثور على إثبات دفع مرتبط بهذا العقد
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="mr-2">تحديث</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 dark:text-amber-100">
              <strong>ملاحظة:</strong> إذا رفعت إثبات الدفع من الخطوة السابقة، اضغط على زر "تحديث" لتحميل البيانات.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-2">خطوات:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>ارجع للخطوة السابقة (إثبات الدفع) وارفع صورة الإثبات</li>
              <li>بعد الرفع، اضغط "الخطوة التالية"</li>
              <li>أو اضغط "تحديث" هنا للتحقق</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleApprove = async () => {
    setIsApproving(true)

    try {
      const supabase = createClient()

      // Update payment proof status using state variable
      const proofId = paymentProofId || paymentProof?.id
      if (!proofId) {
        throw new Error('لم يتم العثور على معرف إثبات الدفع')
      }

      const { error: proofError } = await supabase
        .from('payment_proofs')
        .update({
          review_status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', proofId)

      if (proofError) throw proofError

      // Update contract payment_proof_id if not set
      await supabase
        .from('contracts')
        .update({ payment_proof_id: proofId })
        .eq('id', contractId)

      // Perform action in store
      const result = await performAction('PAYMENT_APPROVED' as any, {
        approvedAt: new Date().toISOString(),
        proofId: proofId,
      })

      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error('Approval error:', error)
      alert(error.message || 'حدث خطأ أثناء الموافقة')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('يرجى كتابة سبب الرفض')
      return
    }

    setIsRejecting(true)

    try {
      const supabase = createClient()

      // Update payment proof status using state variable
      const proofId = paymentProofId || paymentProof?.id
      if (!proofId) {
        throw new Error('لم يتم العثور على معرف إثبات الدفع')
      }

      const { error: proofError } = await supabase
        .from('payment_proofs')
        .update({
          review_status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', proofId)

      if (proofError) throw proofError

      // Send notification to client
      if (contractData.client_id) {
        const { sendContractNotification } = await import('@/app/actions/notifications')
        await sendContractNotification({
          userId: contractData.client_id,
          contractId: contractId,
          contractNumber: contractData.contract_number,
          type: 'payment_rejected',
          customMessage: `تم رفض إثبات الدفع. السبب: ${rejectionReason}. يرجى رفع إثبات دفع جديد.`
        })
      }

      // Perform action in store
      const result = await performAction('PAYMENT_REJECTED' as any, {
        rejectedAt: new Date().toISOString(),
        reason: rejectionReason,
        proofId: contractData.payment_proof_id,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      setShowRejectForm(false)
      setRejectionReason("")
    } catch (error: any) {
      console.error('Rejection error:', error)
      alert(error.message || 'حدث خطأ أثناء الرفض')
    } finally {
      setIsRejecting(false)
    }
  }

  // Admin view - Review payment proof
  return (
    <div className="space-y-6">
      <Card className="border-2 border-orange-500">
        <CardHeader>
          <CardTitle className="text-orange-900">⚠️ إجراء مطلوب: مراجعة إثبات الدفع</CardTitle>
          <CardDescription>
            يرجى مراجعة إثبات الدفع المرفوع من قبل العميل
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Proof Image */}
          {contractData.payment_proof?.proof_image_url && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">إثبات الدفع:</p>
              <img
                src={signedImageUrl || contractData.payment_proof.proof_image_url}
                alt="Payment Proof"
                className="w-full max-h-96 object-contain rounded border"
              />
            </div>
          )}

          {/* Payment Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">المبلغ</p>
              <p className="font-bold text-lg">
                {Number(contractData.payment_proof?.amount || 0).toLocaleString('ar-EG')} ج.م
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">رقم المعاملة</p>
              <p className="font-semibold">
                {contractData.payment_proof?.transaction_reference || 'غير محدد'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {!showRejectForm ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-red-200 hover:bg-red-50"
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle className="h-5 w-5 ml-2 text-red-600" />
                رفض
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    جاري الموافقة...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 ml-2" />
                    الموافقة على الدفع
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="سبب الرفض..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectionReason("")
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={isRejecting || !rejectionReason.trim()}
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      جاري الرفض...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 ml-2" />
                      تأكيد الرفض
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
