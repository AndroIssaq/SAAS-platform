import { getDeletionRequests } from "@/lib/actions/contract-deletion"
import { DeletionRequestsList } from "@/components/admin/deletion-requests-list"

export default async function AdminDeletionRequestsPage() {
  const requests = await getDeletionRequests()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">طلبات حذف العقود</h1>
        <p className="text-muted-foreground">مراجعة والموافقة أو رفض طلبات حذف العقود من الشركاء</p>
      </div>

      <DeletionRequestsList requests={requests} />
    </div>
  )
}
