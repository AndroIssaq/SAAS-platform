import { getAllPayouts } from "@/lib/actions/affiliates"
import { PayoutsTable } from "@/components/admin/payouts-table"

export default async function AdminPayoutsPage() {
  const payouts = await getAllPayouts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المدفوعات</h1>
          <p className="text-muted-foreground">إدارة مدفوعات الشركاء</p>
        </div>
      </div>

      <PayoutsTable payouts={payouts} />
    </div>
  )
}
