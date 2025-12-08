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
import { deleteContractDirectly } from "@/lib/actions/contract-deletion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DeleteContractButtonProps {
  contractId: string
  contractNumber: string
}

export function DeleteContractButton({ contractId, contractNumber }: DeleteContractButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!reason.trim()) {
      toast.error("يرجى كتابة سبب الحذف")
      return
    }

    setLoading(true)
    try {
      const result = await deleteContractDirectly(contractId, reason)

      if (result.success) {
        toast.success(result.message)
        setOpen(false)
        router.push("/admin/contracts")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          حذف العقد
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف العقد نهائياً</DialogTitle>
          <DialogDescription>
            هذا الإجراء لا يمكن التراجع عنه. سيتم حذف العقد وجميع البيانات المرتبطة به.
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
              placeholder="اكتب سبب حذف هذا العقد..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium">⚠️ تحذير</p>
            <p className="text-xs text-muted-foreground mt-1">
              سيتم حذف العقد نهائياً ولن يمكن استرجاعه. سيتم إشعار الشريك (إن وجد) بالحذف.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            تأكيد الحذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
