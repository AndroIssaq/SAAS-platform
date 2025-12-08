import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getPendingPaymentProofs } from "@/app/actions/payment-review"
import { PaymentProofReviewCard } from "@/components/admin/payment-proof-review-card"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, AlertCircle, CheckCircle } from "lucide-react"

export const metadata = {
  title: "مراجعة الدفعات - عَقدي",
  description: "مراجعة إثباتات الدفع من العملاء",
}

async function PaymentReviewList() {
  const result = await getPendingPaymentProofs()

  if (!result.success || !result.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || "فشل تحميل إثباتات الدفع"}
        </AlertDescription>
      </Alert>
    )
  }

  if (result.data.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                لا توجد دفعات قيد المراجعة
              </h3>
              <p className="text-green-700 text-sm">
                جميع إثباتات الدفع تمت مراجعتها
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {result.data.map((paymentProof) => (
        <PaymentProofReviewCard key={paymentProof.id} paymentProof={paymentProof} />
      ))}
    </div>
  )
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userData?.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">مراجعة الدفعات</h1>
            <p className="text-muted-foreground">
              مراجعة وقبول إثباتات الدفع من العملاء
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>ملاحظة أمنية:</strong> يتم تتبع جميع عمليات المراجعة مع IP والتوقيت. 
          تأكد من صحة إثبات الدفع قبل القبول.
        </AlertDescription>
      </Alert>

      {/* Payment List */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        }
      >
        <PaymentReviewList />
      </Suspense>
    </div>
  )
}
