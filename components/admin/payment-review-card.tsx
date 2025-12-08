"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { reviewPaymentProof } from "@/lib/actions/payment-proofs"
import { PAYMENT_METHOD_LABELS, REVIEW_STATUS_COLORS, type PaymentProofWithContract } from "@/lib/types/payment"
import { CheckCircle, XCircle, Eye, Calendar, User, CreditCard, Hash, MapPin, Monitor } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface PaymentReviewCardProps {
  payment: PaymentProofWithContract
  onReviewed?: () => void
}

export function PaymentReviewCard({ payment, onReviewed }: PaymentReviewCardProps) {
  const [loading, setLoading] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const handleApprove = async () => {
    if (!confirm("هل أنت متأكد من قبول إثبات الدفع وتفعيل العقد؟")) {
      return
    }

    setLoading(true)
    const result = await reviewPaymentProof({
      payment_proof_id: payment.id,
      review_status: "approved",
      review_notes: reviewNotes || undefined,
    })
    setLoading(false)

    if (result.success) {
      toast.success(result.message)
      onReviewed?.()
    } else {
      toast.error(result.error)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("يرجى كتابة سبب الرفض")
      return
    }

    setLoading(true)
    const result = await reviewPaymentProof({
      payment_proof_id: payment.id,
      review_status: "rejected",
      review_notes: reviewNotes || undefined,
      rejection_reason: rejectionReason,
    })
    setLoading(false)

    if (result.success) {
      toast.success(result.message)
      setShowRejectDialog(false)
      onReviewed?.()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {payment.contract.client_name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>{payment.contract.contract_number}</span>
            </div>
          </div>
          <Badge className={REVIEW_STATUS_COLORS[payment.review_status]}>
            {payment.review_status === "pending" ? "قيد المراجعة" : payment.review_status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contract Info */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg text-sm">
          <div>
            <p className="text-muted-foreground mb-1">الخدمة</p>
            <p className="font-medium">{payment.contract.service_type}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">المبلغ الإجمالي</p>
            <p className="font-medium">{payment.contract.total_amount.toLocaleString('ar-EG')} ج.م</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>طريقة الدفع:</strong> {PAYMENT_METHOD_LABELS[payment.payment_method]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>المبلغ المدفوع:</strong> {payment.amount.toLocaleString('ar-EG')} {payment.currency}
            </span>
          </div>

          {payment.transaction_reference && (
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>رقم العملية:</strong> {payment.transaction_reference}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>تاريخ الرفع:</strong>{" "}
              {new Date(payment.uploaded_at).toLocaleString("ar-SA")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>البريد:</strong> {payment.contract.client_email}
            </span>
          </div>
        </div>

        {/* Security Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-sm">
          <p className="font-semibold text-blue-900 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            معلومات الأمان
          </p>
          {payment.client_ip && (
            <div className="flex items-center gap-2 text-blue-800">
              <MapPin className="h-3 w-3" />
              <span>IP: {payment.client_ip}</span>
            </div>
          )}
          {payment.user_agent && (
            <p className="text-xs text-blue-700 truncate">
              {payment.user_agent}
            </p>
          )}
        </div>

        {/* Payment Proof Image */}
        <div className="space-y-2">
          <Label>إثبات الدفع</Label>
          <div className="relative h-48 border rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={payment.proof_image_url}
              alt="إثبات الدفع"
              fill
              className="object-contain"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowImage(true)}
          >
            <Eye className="h-4 w-4 ml-2" />
            عرض بالحجم الكامل
          </Button>
        </div>

        {/* Review Notes */}
        <div className="space-y-2">
          <Label htmlFor="review_notes">ملاحظات المراجعة (اختياري)</Label>
          <Textarea
            id="review_notes"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="أضف ملاحظات للعميل..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 ml-2" />
            قبول وتفعيل العقد
          </Button>

          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={loading}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 ml-2" />
                رفض
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفض إثبات الدفع</DialogTitle>
                <DialogDescription>
                  يرجى كتابة سبب الرفض. سيتم إرساله للعميل.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rejection_reason">سبب الرفض *</Label>
                  <Textarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="مثال: الصورة غير واضحة، المبلغ غير مطابق، إلخ..."
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  variant="destructive"
                  className="flex-1"
                >
                  تأكيد الرفض
                </Button>
                <Button
                  onClick={() => setShowRejectDialog(false)}
                  variant="outline"
                  disabled={loading}
                >
                  إلغاء
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>

      {/* Full Image Dialog */}
      <Dialog open={showImage} onOpenChange={setShowImage}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>إثبات الدفع - {payment.contract.contract_number}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[600px]">
            <Image
              src={payment.proof_image_url}
              alt="إثبات الدفع"
              fill
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
