'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Check, X, Loader2, Eye, FileImage, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { approvePaymentProof, rejectPaymentProof } from '@/app/actions/payment-review'
import Image from 'next/image'
import Link from 'next/link'

interface PaymentProofReviewCardProps {
  paymentProof: {
    id: string
    proof_image_url: string
    amount: number
    currency: string
    transaction_reference?: string
    uploaded_at: string
    metadata?: any
    contracts: {
      id: string
      contract_number: string
      client_name: string
      client_email: string
      service_type: string
      deposit_amount: number
    }
  }
  onReviewComplete?: () => void
}

export function PaymentProofReviewCard({ paymentProof, onReviewComplete }: PaymentProofReviewCardProps) {
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)

  const handleApprove = async () => {
    setApproving(true)

    try {
      const result = await approvePaymentProof({
        paymentProofId: paymentProof.id,
        contractId: paymentProof.contracts.id,
        reviewNotes: 'تم القبول'
      })

      if (result.success) {
        toast.success('✅ تم قبول إثبات الدفع', {
          description: 'تم تحديث حالة العقد وإرسال إشعار للعميل'
        })
        onReviewComplete?.()
      } else {
        toast.error('فشلت العملية', {
          description: result.error
        })
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('يرجى إدخال سبب الرفض')
      return
    }

    setRejecting(true)

    try {
      const result = await rejectPaymentProof({
        paymentProofId: paymentProof.id,
        contractId: paymentProof.contracts.id,
        rejectionReason
      })

      if (result.success) {
        toast.success('تم رفض إثبات الدفع', {
          description: 'تم إرسال إشعار للعميل مع سبب الرفض'
        })
        setShowRejectDialog(false)
        setRejectionReason('')
        onReviewComplete?.()
      } else {
        toast.error('فشلت العملية', {
          description: result.error
        })
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setRejecting(false)
    }
  }

  const uploadDate = new Date(paymentProof.uploaded_at)
  const timeAgo = getTimeAgo(uploadDate)

  return (
    <Card className="border-2 hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {paymentProof.contracts.client_name}
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 ml-1" />
                {timeAgo}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              <Link 
                href={`/admin/contracts/${paymentProof.contracts.id}`}
                className="hover:underline font-mono"
              >
                {paymentProof.contracts.contract_number}
              </Link>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contract Details */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الخدمة:</span>
            <span className="font-medium">{paymentProof.contracts.service_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المبلغ المطلوب:</span>
            <span className="font-bold text-lg">{Number(paymentProof.contracts.deposit_amount).toLocaleString('ar-EG')} ج.م</span>
          </div>
          {paymentProof.transaction_reference && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">رقم المعاملة:</span>
              <span className="font-mono">{paymentProof.transaction_reference}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">البريد الإلكتروني:</span>
            <span className="text-sm">{paymentProof.contracts.client_email}</span>
          </div>
        </div>

        {/* Image Preview */}
        <div className="space-y-2">
          <Label>إثبات الدفع</Label>
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer group"
            onClick={() => setShowImageDialog(true)}
          >
            <Image
              src={paymentProof.proof_image_url}
              alt="Payment Proof"
              fill
              className="object-contain group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            onClick={handleApprove}
            disabled={approving || rejecting}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {approving ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري القبول...
              </>
            ) : (
              <>
                <Check className="ml-2 h-4 w-4" />
                موافقة
              </>
            )}
          </Button>

          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={approving || rejecting}
                size="lg"
              >
                <X className="ml-2 h-4 w-4" />
                رفض
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفض إثبات الدفع</DialogTitle>
                <DialogDescription>
                  يرجى تحديد سبب رفض إثبات الدفع. سيتم إرسال السبب للعميل.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">سبب الرفض *</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="مثال: المبلغ غير واضح في الصورة، يرجى رفع صورة أوضح..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleReject}
                    disabled={rejecting || !rejectionReason.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    {rejecting ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري الرفض...
                      </>
                    ) : (
                      <>
                        <X className="ml-2 h-4 w-4" />
                        تأكيد الرفض
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectDialog(false)
                      setRejectionReason('')
                    }}
                    variant="outline"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>

      {/* Full Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>إثبات الدفع - {paymentProof.contracts.contract_number}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={paymentProof.proof_image_url}
              alt="Payment Proof Full Size"
              fill
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// Helper function to get time ago
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'الآن'
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  
  const diffDays = Math.floor(diffHours / 24)
  return `منذ ${diffDays} يوم`
}
