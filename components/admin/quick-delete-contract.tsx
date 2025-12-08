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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Trash2, Loader2 } from "lucide-react"
import { deleteContractDirectly } from "@/lib/actions/contract-deletion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface QuickDeleteContractProps {
  contractId: string
  contractNumber: string
}

export function QuickDeleteContract({ contractId, contractNumber }: QuickDeleteContractProps) {
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
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف العقد {contractNumber}</DialogTitle>
          <DialogDescription>
            هذا الإجراء لا يمكن التراجع عنه. سيتم حذف العقد نهائياً وإشعار الشريك (إن وجد).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="space-y-2">
            <Label htmlFor="delete-reason">سبب الحذف *</Label>
            <Textarea
              id="delete-reason"
              placeholder="اكتب سبب حذف هذا العقد..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || !reason.trim()}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            حذف نهائياً
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
