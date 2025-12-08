import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EnhancedContractForm } from "@/components/affiliate/enhanced-contract-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewAffiliateContractPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/affiliate/contracts">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للعقود
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">عقد جديد</h1>
        <p className="text-muted-foreground mt-2">
          إنشاء عقد جديد لعميل - اختر من الخدمات المتاحة أو أنشئ خدمة مخصصة
        </p>
      </div>

      <EnhancedContractForm 
        affiliateId={affiliate.id} 
        preSelectedServiceId={params.service}
      />
    </div>
  )
}
