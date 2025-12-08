import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAffiliateStats, getAffiliatePayouts, getAffiliateReferrals } from "@/lib/actions/affiliates"
import { AffiliateDashboard } from "@/components/affiliate/affiliate-dashboard"
import { ReferralLinkCard } from "@/components/affiliate/referral-link-card"
import { AffiliatePayoutsTable } from "@/components/affiliate/affiliate-payouts-table"
import { AffiliateReferralsTable } from "@/components/affiliate/affiliate-referrals-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut } from "lucide-react"
import { logout } from "@/lib/actions/auth"
import { formatDate } from "@/lib/utils/date"

export default async function AffiliateDashboardPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get affiliate info
  const { data: affiliate, error: affiliateError } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (affiliateError || !affiliate) {
    console.error("Affiliate not found:", affiliateError)
    redirect("/")
  }

  const [stats, payouts, referrals] = await Promise.all([
    getAffiliateStats(affiliate.id),
    getAffiliatePayouts(affiliate.id),
    getAffiliateReferrals(affiliate.id),
  ])

  const payoutColumns = [
    {
      key: "created_at",
      label: "التاريخ",
      render: (payout: any) => formatDate(payout.created_at),
    },
    {
      key: "amount",
      label: "المبلغ",
      render: (payout: any) => `${payout.amount.toLocaleString("ar-EG")} ج.م`,
    },
    {
      key: "status",
      label: "الحالة",
      render: (payout: any) => {
        const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
          pending: { label: "قيد الانتظار", variant: "secondary" },
          paid: { label: "مدفوع", variant: "default" },
          cancelled: { label: "ملغي", variant: "outline" },
        }
        const status = statusMap[payout.status] || { label: payout.status, variant: "secondary" as const }
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      key: "paid_at",
      label: "تاريخ الدفع",
      render: (payout: any) => (payout.paid_at ? formatDate(payout.paid_at) : "-"),
    },
  ]

  const referralColumns = [
    {
      key: "created_at",
      label: "التاريخ",
      render: (contract: any) => formatDate(contract.created_at),
    },
    {
      key: "client",
      label: "العميل",
      render: (contract: any) => contract.clients?.company_name || "-",
    },
    {
      key: "service_type",
      label: "الخدمة",
    },
    {
      key: "total_amount",
      label: "قيمة العقد",
      render: (contract: any) => `${contract.total_amount.toLocaleString("ar-EG")} ج.م`,
    },
    {
      key: "status",
      label: "الحالة",
      render: (contract: any) => {
        const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
          draft: { label: "مسودة", variant: "secondary" },
          sent: { label: "مرسل", variant: "outline" },
          signed: { label: "موقع", variant: "default" },
          completed: { label: "مكتمل", variant: "default" },
        }
        const status = statusMap[contract.status] || { label: contract.status, variant: "secondary" as const }
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-primary/70 mb-2">عَقدي • لوحة الشريك</p>
          <h1 className="text-3xl font-bold">مرحباً، {user.user_metadata?.full_name || user.email}</h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            تابع أداء الإحالات، أرباحك، وحالة المدفوعات من مكان واحد.
          </p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm" className="gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </form>
      </div>

      <AffiliateDashboard stats={stats} />

      <ReferralLinkCard affiliateCode={affiliate.referral_code} />

      <Card>
        <CardHeader>
          <CardTitle>المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length > 0 ? (
            <AffiliatePayoutsTable payouts={payouts} />
          ) : (
            <p className="text-sm text-muted-foreground">
              لم يتم تسجيل أي مدفوعات حتى الآن. عند وصول إحالات مكتملة ويتم اعتماد أرباحك، ستظهر تفاصيل المدفوعات
              هنا.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الإحالات</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length > 0 ? (
            <AffiliateReferralsTable referrals={referrals} />
          ) : (
            <p className="text-sm text-muted-foreground">
              لا توجد إحالات مسجلة بعد. شارك رابط الإحالة الخاص بك مع عملائك المحتملين، وعندما يتم إنشاء عقود عبر
              عَقدي باستخدام هذا الرابط ستظهر هنا تفاصيل الإحالات.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
