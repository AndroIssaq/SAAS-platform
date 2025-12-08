import Link from "next/link"
import { getAllAffiliates } from "@/lib/actions/affiliates"
import { AffiliatesTable } from "@/components/admin/affiliates-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function AdminAffiliatesPage() {
  const affiliates = await getAllAffiliates()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الشركاء</h1>
          <p className="text-muted-foreground">إدارة الشركاء والعمولات</p>
        </div>
        <Button asChild>
          <Link href="/admin/affiliates/new">
            <Plus className="ml-2 h-4 w-4" />
            شريك جديد
          </Link>
        </Button>
      </div>

      <AffiliatesTable affiliates={affiliates} />
    </div>
  )
}
