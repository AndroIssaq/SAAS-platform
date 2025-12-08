import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"
import { AffiliateContractsTable } from "@/components/affiliate/affiliate-contracts-table"

export default async function AffiliateContractsPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get affiliate info
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!affiliate) {
    redirect("/")
  }

  // Get affiliate's contracts
  const { data: contracts } = await supabase
    .from("contracts")
    .select(`
      *,
      client:users!contracts_client_id_fkey(full_name, email, phone)
    `)
    .eq("affiliate_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">العقود</h1>
          <p className="text-muted-foreground">إدارة عقود عملائك</p>
        </div>
        <Button asChild>
          <Link href="/affiliate/contracts/new">
            <Plus className="ml-2 h-4 w-4" />
            عقد جديد
          </Link>
        </Button>
      </div>

      {!contracts || contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">لا توجد عقود بعد</p>
            <Button asChild>
              <Link href="/affiliate/contracts/new">
                <Plus className="ml-2 h-4 w-4" />
                إنشاء عقد جديد
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AffiliateContractsTable contracts={contracts} />
      )}
    </div>
  )
}
