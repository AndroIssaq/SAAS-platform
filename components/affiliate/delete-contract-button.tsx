"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Loader2 } from "lucide-react"
import { requestContractDeletion } from "@/lib/actions/contract-deletion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DeleteContractButtonProps {
  contractId: string
  contractNumber: string
  hasPendingRequest?: boolean
}

export function DeleteContractButton({ contractId, contractNumber, hasPendingRequest }: DeleteContractButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("يرجى كتابة سبب الحذف")
      return
    }

    setLoading(true)
    try {
      const result = await requestContractDeletion(contractId, reason)

      if (result.success) {
        toast.success(result.message)
        setOpen(false)
        setReason("")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الطلب")
    } finally {
      setLoading(false)
    }
  }

  if (hasPendingRequest) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Trash2 className="h-4 w-4" />
        طلب حذف معلق
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          طلب حذف العقد
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>طلب حذف العقد</DialogTitle>
          <DialogDescription>
            سيتم إرسال طلب الحذف للمسؤول للموافقة عليه. يرجى كتابة سبب الحذف.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>رقم العقد</Label>
            <p className="text-sm font-mono bg-muted p-2 rounded">{contractNumber}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">سبب الحذف *</Label>
            <Textarea
              id="reason"
              placeholder="اكتب سبب طلب حذف هذا العقد..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            إرسال طلب الحذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
