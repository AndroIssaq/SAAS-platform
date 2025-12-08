import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReferralLinkCard } from "@/components/affiliate/referral-link-card"
import { Share2, Users, DollarSign, TrendingUp } from "lucide-react"

export default async function AffiliateReferralPage() {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">رابط الإحالة</h1>
        <p className="text-muted-foreground">شارك رابطك واحصل على عمولة من كل عميل</p>
      </div>

      <ReferralLinkCard affiliateCode={affiliate.referral_code} />

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة العمولة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliate.commission_rate}%</div>
            <p className="text-xs text-muted-foreground">من قيمة كل عقد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإحالات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliate.total_referrals || 0}</div>
            <p className="text-xs text-muted-foreground">عميل محال</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرباح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(affiliate.total_earnings || 0).toLocaleString("ar-SA")} ر.س
            </div>
            <p className="text-xs text-muted-foreground">منذ البداية</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            كيف تستخدم رابط الإحالة؟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. شارك الرابط</h4>
            <p className="text-sm text-muted-foreground">
              شارك رابط الإحالة الخاص بك مع العملاء المحتملين عبر البريد الإلكتروني، وسائل التواصل الاجتماعي، أو أي قناة أخرى.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">2. العميل يسجل</h4>
            <p className="text-sm text-muted-foreground">
              عندما ينقر العميل على رابطك ويسجل، سيتم ربطه تلقائياً بحسابك كشريك.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">3. احصل على عمولتك</h4>
            <p className="text-sm text-muted-foreground">
              عند توقيع العميل على عقد، ستحصل على {affiliate.commission_rate}% من قيمة العقد كعمولة.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">4. أو أنشئ عقد مباشرة</h4>
            <p className="text-sm text-muted-foreground">
              يمكنك أيضاً إنشاء عقد جديد مباشرة من لوحة التحكم وإرساله للعميل للتوقيع.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
