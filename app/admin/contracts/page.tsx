import { getContracts } from "@/app/actions/contracts"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Plus, Eye, DollarSign, User, Search, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import { QuickDeleteContract } from "@/components/admin/quick-delete-contract"
import { createClient } from "@/lib/supabase/server"

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending_signature: "بانتظار التوقيع",
  signed: "موقع",
  active: "نشط",
  completed: "مكتمل",
  cancelled: "ملغي",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_signature: "bg-yellow-100 text-yellow-800",
  signed: "bg-green-100 text-green-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
}

export default async function ContractsPage() {
  const result = await getContracts()
  const contracts = result.success ? result.data : []
  
  // Get current user to check for pending approvals
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Helper function to check if contract needs admin approval
  const needsAdminApproval = (contract: any) => {
    return contract.admin_review_approved === false && 
           contract.current_step_name === 'review'
  }
  
  // Helper function to check if contract is newly created (within last 24 hours)
  const isNewContract = (contract: any) => {
    const createdAt = new Date(contract.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">إدارة العقود</h1>
            <p className="text-muted-foreground">عرض وإدارة جميع العقود</p>
          </div>
          <Button asChild size="lg">
            <Link href="/admin/contracts/create">
              <Plus className="ml-2" />
              عقد جديد
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="البحث عن عقد..." className="pr-10" />
            </div>
          </CardContent>
        </Card>

        {contracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد عقود بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contracts.map((contract: any) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {contract.contract_number}
                        {needsAdminApproval(contract) && (
                          <Badge variant="destructive" className="gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            يحتاج موافقتك
                          </Badge>
                        )}
                        {isNewContract(contract) && !needsAdminApproval(contract) && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            جديد
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{contract.client_name || contract.client?.full_name}</CardDescription>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[contract.status]}`}>
                      {statusLabels[contract.status]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">نوع الخدمة</p>
                      <p className="font-medium">{contract.service_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">الباقة</p>
                      <p className="font-medium">{contract.package_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">المبلغ</p>
                      <p className="font-medium">{Number(contract.total_amount).toLocaleString("ar-EG")} ج.م</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">التاريخ</p>
                      <p className="font-medium">{formatDate(contract.created_at)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 justify-between items-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/contracts/${contract.id}/flow`}>عرض التفاصيل</Link>
                    </Button>
                    <QuickDeleteContract contractId={contract.id} contractNumber={contract.contract_number} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
