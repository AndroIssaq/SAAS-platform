"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Eye, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface PaymentProofReviewProps {
  contractId: string
  contractNumber: string
  clientName: string
  clientId: string
  clientEmail: string
  paymentProofUrl: string
  totalAmount: number
  depositAmount: number
  onApprove: () => void
  onReject: () => void
}

export function PaymentProofReview({
  contractId,
  contractNumber,
  clientName,
  clientId,
  clientEmail,
  paymentProofUrl,
  totalAmount,
  depositAmount,
  onApprove,
  onReject
}: PaymentProofReviewProps) {
  const [reviewing, setReviewing] = useState(false)
  const [notes, setNotes] = useState("")
  const [showImage, setShowImage] = useState(true) // ✅ Show image by default

  const handleApprove = async () => {
    setReviewing(true)
    try {
      const response = await fetch("/api/contracts/payment-proof/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          approved: true,
          notes: notes || "تم قبول إثبات الدفع"
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success("تم قبول إثبات الدفع بنجاح!")
        onApprove()
      } else {
        toast.error(result.error || "فشل في قبول إثبات الدفع")
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء معالجة الطلب")
    } finally {
      setReviewing(false)
    }
  }

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error("يرجى كتابة سبب الرفض")
      return
    }

    setReviewing(true)
    try {
      const response = await fetch("/api/contracts/payment-proof/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          approved: false,
          notes
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success("تم رفض إثبات الدفع")
        onReject()
      } else {
        toast.error(result.error || "فشل في رفض إثبات الدفع")
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء معالجة الطلب")
    } finally {
      setReviewing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          مراجعة إثبات الدفع
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Info */}
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">رقم العقد</p>
            <p className="font-semibold">{contractNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">اسم العميل</p>
            <p className="font-semibold">{clientName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
            <p className="font-semibold text-lg">{totalAmount.toLocaleString('ar-EG')} ج.م</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">العربون المطلوب</p>
            <p className="font-semibold text-lg text-green-600">{depositAmount.toLocaleString('ar-EG')} ج.م</p>
          </div>
        </div>

        {/* Payment Proof Image */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold">إثبات الدفع</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImage(!showImage)}
            >
              <Eye className="h-4 w-4 ml-2" />
              {showImage ? "إخفاء" : "عرض"} الصورة
            </Button>
          </div>
          
          {showImage && (
            <div className="relative w-full h-[400px] border rounded-lg overflow-hidden">
              <Image
                src={paymentProofUrl}
                alt="إثبات الدفع"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            ملاحظات {!notes.trim() && <span className="text-red-500">(مطلوبة في حالة الرفض)</span>}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أضف ملاحظاتك هنا..."
            rows={4}
          />
        </div>

        {/* Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>تنبيه:</strong> عند الموافقة، سيتم نقل العقد تلقائياً إلى الخطوة 8 (المرحلة النهائية) لكل من المدير والعميل.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleApprove}
            disabled={reviewing}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <CheckCircle className="h-5 w-5 ml-2" />
            {reviewing ? "جاري المعالجة..." : "قبول إثبات الدفع"}
          </Button>
          <Button
            onClick={handleReject}
            disabled={reviewing || !notes.trim()}
            variant="destructive"
            className="flex-1"
            size="lg"
          >
            <XCircle className="h-5 w-5 ml-2" />
            {reviewing ? "جاري المعالجة..." : "رفض إثبات الدفع"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
