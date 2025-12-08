import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Mail, Phone, Building } from "lucide-react"
import Link from "next/link"

export default async function AffiliateClientsPage() {
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

  // Get affiliate's clients through contracts
  const { data: contracts } = await supabase
    .from("contracts")
    .select(`
      id,
      status,
      created_at,
      client:users!contracts_client_id_fkey(
        id,
        full_name,
        email,
        phone
      ),
      client_info:clients!contracts_client_id_fkey(
        company_name,
        industry
      )
    `)
    .eq("affiliate_id", user.id)
    .order("created_at", { ascending: false })

  // Group by unique clients
  const uniqueClients = contracts?.reduce((acc: any[], contract: any) => {
    const clientId = contract.client?.id
    if (clientId && !acc.find((c) => c.id === clientId)) {
      acc.push({
        id: clientId,
        name: contract.client?.full_name || "غير معروف",
        email: contract.client?.email || "",
        phone: contract.client?.phone || "",
        company: contract.client_info?.company_name || "",
        industry: contract.client_info?.industry || "",
        contractsCount: contracts.filter((c) => c.client?.id === clientId).length,
        lastContract: contract.created_at,
      })
    }
    return acc
  }, []) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">عملائي</h1>
          <p className="text-muted-foreground">إدارة العملاء الذين أحلتهم</p>
        </div>
        <Button asChild>
          <Link href="/affiliate/contracts/new">
            <Plus className="ml-2 h-4 w-4" />
            عقد جديد
          </Link>
        </Button>
      </div>

      {uniqueClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">لا يوجد عملاء بعد</p>
            <Button asChild>
              <Link href="/affiliate/contracts/new">
                <Plus className="ml-2 h-4 w-4" />
                إنشاء عقد جديد
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {uniqueClients.map((client: any) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{client.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {client.contractsCount} {client.contractsCount === 1 ? "عقد" : "عقود"}
                  </span>
                </CardTitle>
                {client.company && <CardDescription>{client.company}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                )}
                {client.industry && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-4 w-4" />
                    {client.industry}
                  </div>
                )}
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/affiliate/clients/${client.id}`}>عرض التفاصيل</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
