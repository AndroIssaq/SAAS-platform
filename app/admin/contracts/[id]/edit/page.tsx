import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ContractTermsEditor } from "@/components/contract/contract-terms-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, FileText } from "lucide-react"
import Link from "next/link"

interface EditContractPageProps {
  params: Promise<{ id: string }>
}

export default async function EditContractPage({ params }: EditContractPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // التحقق من المصادقة
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // التحقق من الصلاحيات
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!userData || userData.role !== "admin") {
    redirect("/")
  }

  // جلب بيانات العقد
  const { data: contract, error } = await supabase
    .from("contracts")
    .select(`
      *,
      clients:client_id (
        company_name,
        user_id
      )
    `)
    .eq("id", id)
    .single()

  if (error || !contract) {
    notFound()
  }

  // التحقق من إمكانية التعديل
  const canEdit =
    contract.status === "draft" || contract.status === "pending_signature"

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href={`/admin/contracts/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            العودة للعقد
          </Link>
          <h1 className="text-3xl font-bold">تعديل العقد</h1>
        </div>

        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">لا يمكن تعديل هذا العقد</h3>
              <p className="text-muted-foreground mb-4">
                العقد في حالة "{contract.status}" ولا يمكن تعديله بعد التوقيع
              </p>
              <Button asChild>
                <Link href={`/admin/contracts/${id}`}>العودة للعقد</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // تحضير البيانات للمحرر
  const initialTerms = {
    service_type: contract.service_type,
    package_name: contract.package_name,
    service_description: contract.contract_terms?.service?.description || "",
    total_amount: contract.total_amount,
    deposit_amount: contract.deposit_amount,
    timeline: contract.contract_terms?.service?.timeline || "",
    payment_method: contract.payment_method,
    deliverables: contract.contract_terms?.service?.deliverables || [""],
    payment_schedule: contract.contract_terms?.payment?.payment_schedule || [""],
    custom_terms: contract.contract_terms?.custom_terms || [],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/admin/contracts/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          العودة للعقد
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">تعديل بنود العقد</h1>
            <p className="text-muted-foreground mt-1">
              رقم العقد: <span className="font-mono font-bold">{contract.contract_number}</span>
            </p>
          </div>
          <Badge variant="secondary">
            {contract.status === "draft" ? "مسودة" : "بانتظار التوقيع"}
          </Badge>
        </div>
      </div>

      {/* معلومات العميل */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات العميل</CardTitle>
          <CardDescription>العقد سيُرسل إلى هذا العميل</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{contract.clients?.company_name || "عميل"}</p>
              <p className="text-sm text-muted-foreground">
                تاريخ الإنشاء: {new Date(contract.created_at).toLocaleDateString("ar-EG")}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/clients/${contract.client_id}`}>عرض ملف العميل</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* محرر العقد */}
      <ContractTermsEditor
        contractId={id}
        initialTerms={initialTerms}
        userRole="admin"
      />
    </div>
  )
}
