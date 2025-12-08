import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ContractTermsEditor } from "@/components/contract/contract-terms-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, FileText, Users, DollarSign } from "lucide-react"
import Link from "next/link"

interface EditContractPageProps {
  params: Promise<{ id: string }>
}

export default async function AffiliateEditContractPage({ params }: EditContractPageProps) {
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
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (!userData || userData.role !== "affiliate") {
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
    .eq("affiliate_id", user.id) // تأكد أن هذا عقد من إحالة الشريك
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
            href={`/affiliate/contracts/${id}`}
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
                <Link href={`/affiliate/contracts/${id}`}>العودة للعقد</Link>
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
          href={`/affiliate/contracts/${id}`}
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
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Users className="ml-1 h-3 w-3" />
            شريك تسويقي
          </Badge>
        </div>
      </div>

      {/* تنبيه للشريك */}
      <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
        <Users className="h-4 w-4 text-purple-600" />
        <AlertDescription>
          <p className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
            🤝 مرحباً {userData.full_name}!
          </p>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            يمكنك تعديل بنود العقد لتناسب احتياجات عميلك. عمولتك ستُحسب تلقائياً بناءً على
            المبلغ الإجمالي. تأكد من مراجعة جميع البنود قبل إرسال العقد للعميل.
          </p>
        </AlertDescription>
      </Alert>

      {/* معلومات العميل والعمولة */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">معلومات العميل</CardTitle>
            <CardDescription>العقد سيُرسل إلى هذا العميل</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{contract.clients?.company_name || "عميل"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              تاريخ الإنشاء: {new Date(contract.created_at).toLocaleDateString("ar-EG")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              عمولتك المتوقعة
            </CardTitle>
            <CardDescription>ستُحسب تلقائياً عند تفعيل العقد</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">نسبة العمولة:</span>
                <span className="font-bold">
                  {contract.affiliate_commission_percentage || 10}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">المبلغ المتوقع:</span>
                <span className="font-bold text-lg text-purple-600">
                  {((contract.total_amount * (contract.affiliate_commission_percentage || 10)) / 100).toLocaleString()} ج.م
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 العمولة ستُدفع خلال 7 أيام من تفعيل العقد
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* محرر العقد */}
      <ContractTermsEditor
        contractId={id}
        initialTerms={initialTerms}
        userRole="affiliate"
      />
    </div>
  )
}
