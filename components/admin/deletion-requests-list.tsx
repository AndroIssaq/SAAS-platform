"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/utils/date"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { reviewDeletionRequest } from "@/lib/actions/contract-deletion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DeletionRequest {
  id: string
  contract_id: string
  reason: string
  status: string
  created_at: string
  reviewed_at?: string
  review_notes?: string
  contract: {
    contract_number: string
    service_type: string
    total_amount: number
    client: { full_name: string }
  }
  requester: {
    full_name: string
    email: string
  }
  reviewer?: {
    full_name: string
  }
}

export function DeletionRequestsList({ requests }: { requests: DeletionRequest[] }) {
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleReview = async () => {
    if (!selectedRequest || !action) return

    setLoading(true)
    try {
      const result = await reviewDeletionRequest(selectedRequest.id, action, notes)

      if (result.success) {
        toast.success(result.message)
        setSelectedRequest(null)
        setAction(null)
        setNotes("")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء المراجعة")
    } finally {
      setLoading(false)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const reviewedRequests = requests.filter((r) => r.status !== "pending")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="default" className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            معلق
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            تمت الموافقة
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            مرفوض
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              طلبات معلقة ({pendingRequests.length})
            </h2>
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-yellow-500/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">عقد رقم {request.contract.contract_number}</CardTitle>
                      <CardDescription>
                        طلب من: {request.requester.full_name} ({request.requester.email})
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">العميل</p>
                      <p className="font-medium">{request.contract.client.full_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الخدمة</p>
                      <p className="font-medium">{request.contract.service_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">المبلغ</p>
                      <p className="font-medium">{request.contract.total_amount.toLocaleString("ar-SA")} ر.س</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">تاريخ الطلب</p>
                      <p className="font-medium">{formatDate(request.created_at)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">سبب الحذف:</p>
                    <p className="text-sm whitespace-pre-wrap">{request.reason}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => {
                        setSelectedRequest(request)
                        setAction("approve")
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      الموافقة
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedRequest(request)
                        setAction("reject")
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      الرفض
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reviewed Requests */}
        {reviewedRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">الطلبات المراجعة ({reviewedRequests.length})</h2>
            {reviewedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">عقد رقم {request.contract.contract_number}</CardTitle>
                      <CardDescription>
                        طلب من: {request.requester.full_name} • راجعه: {request.reviewer?.full_name}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">العميل</p>
                      <p className="font-medium">{request.contract.client.full_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">تاريخ المراجعة</p>
                      <p className="font-medium">
                        {request.reviewed_at ? formatDate(request.reviewed_at) : "-"}
                      </p>
                    </div>
                  </div>

                  {request.review_notes && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">ملاحظات المراجعة:</p>
                      <p className="text-sm whitespace-pre-wrap">{request.review_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {requests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات حذف</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "الموافقة على حذف العقد" : "رفض طلب حذف العقد"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "سيتم حذف العقد نهائياً من النظام. هل أنت متأكد؟"
                : "سيتم رفض الطلب وإشعار الشريك."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>رقم العقد</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{selectedRequest.contract.contract_number}</p>
              </div>

              <div className="space-y-2">
                <Label>سبب الطلب</Label>
                <p className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">{selectedRequest.reason}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات {action === "reject" ? "(السبب) *" : "(اختياري)"}</Label>
                <Textarea
                  id="notes"
                  placeholder={action === "reject" ? "اكتب سبب الرفض..." : "أضف ملاحظات إضافية..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)} disabled={loading}>
              إلغاء
            </Button>
            <Button
              variant={action === "approve" ? "default" : "destructive"}
              onClick={handleReview}
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {action === "approve" ? "تأكيد الحذف" : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
