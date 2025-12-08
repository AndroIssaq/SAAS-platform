import { getAllClients } from "@/lib/actions/admin"
import { ClientsTable } from "@/components/admin/clients-table"

export default async function AdminClientsPage() {
  const result = await getAllClients()
  const clients = result.success ? result.data : []
  const error = result.success ? null : result.error

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">العملاء</h1>
          <p className="text-muted-foreground">إدارة جميع العملاء</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">حدث خطأ أثناء تحميل العملاء: {error}</p>
      )}

      <ClientsTable clients={clients} />
    </div>
  )
}
