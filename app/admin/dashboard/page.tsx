import { getDashboardStats } from "@/lib/actions/admin"
import { ensureUserAccount } from "@/lib/actions/account"
import { getWorkspacePublicKey } from "@/lib/actions/workspace-keys"
import { getSubscriptionStatus } from "@/lib/actions/subscriptions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FolderKanban, FileText, ImageIcon, Sparkles, ShieldCheck, Lock } from "lucide-react"
import { PendingSignaturesCard } from "@/components/dashboard/pending-signatures-card"
import { NewContractsCard } from "@/components/dashboard/new-contracts-card"
import { TrialCountdown } from "@/components/subscription/trial-countdown"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function AdminDashboardPage() {
  await ensureUserAccount()
  const stats = await getDashboardStats()
  const workspaceKey = await getWorkspacePublicKey()
  const subscriptionStatus = await getSubscriptionStatus()
  const encryptionActive = Boolean(workspaceKey.success && workspaceKey.data?.public_key)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const statCards = [
    {
      title: "إجمالي العملاء",
      value: stats.totalClients,
      icon: Users,
      description: "عدد العملاء المسجلين",
    },
    {
      title: "المشاريع النشطة",
      value: stats.activeProjects,
      icon: FolderKanban,
      description: "مشاريع قيد التنفيذ",
    },
    {
      title: "إجمالي العقود",
      value: stats.totalContracts,
      icon: FileText,
      description: "عقود موقعة",
    },
    {
      title: "أعمال منشورة",
      value: stats.publishedPortfolio,
      icon: ImageIcon,
      description: "في معرض الأعمال",
    },
  ]

  const isEmptyWorkspace =
    stats.totalClients === 0 &&
    stats.activeProjects === 0 &&
    stats.totalContracts === 0 &&
    stats.publishedPortfolio === 0

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-primary/70 mb-2">عَقدي • لوحة التحكم</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">مساحتك الذكية لإدارة العقود والمشاريع</h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            راقب نمو عملك، تابع العقود، وتواصل مع عملائك في مكان واحد.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-sm">
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-background px-3 py-2.5">
            <p className="text-[11px] text-primary/80 font-medium mb-1">إجمالي العقود</p>
            <p className="text-lg font-semibold">{stats.totalContracts}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-background px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground font-medium mb-1">المشاريع النشطة</p>
            <p className="text-lg font-semibold">{stats.activeProjects}</p>
          </div>
        </div>
      </div>

      {/* Subscription Status / Trial Countdown */}
      <TrialCountdown initialStatus={subscriptionStatus} />

      <Card className="border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-background to-background">
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-500/80 mb-1">تشفير شامل</p>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              كل العقود تُشفّر طرف-لطرف داخل مساحة العمل
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              يتم توليد المفاتيح بمكتبة libsodium، وتُحفظ النسخ الاحتياطية مشفّرة لكل عضو. يتم تسليم التطبيق عبر Cloudflare TLS 1.3 مع HSTS وبصمة cf-ray لكل جلسة.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm min-w-[220px]">
            <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs text-emerald-300/90">حالة المفتاح</p>
              <div className="flex items-center gap-2 text-base font-semibold">
                <Lock className={`h-4 w-4 ${encryptionActive ? 'text-emerald-400' : 'text-amber-400'}`} />
                {encryptionActive ? 'مفعّل' : 'لم يتم توليد المفتاح بعد'}
              </div>
              {workspaceKey.data?.updated_at && (
                <p className="mt-1 text-[11px] text-muted-foreground">آخر تدوير: {new Date(workspaceKey.data.updated_at).toLocaleDateString('ar-EG')}</p>
              )}
            </div>
            <Link
              href="/admin/settings#encryption"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 font-medium text-sm hover:border-emerald-400"
            >
              إدارة مفاتيح التشفير
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Pending Signatures */}
      {user && <PendingSignaturesCard userId={user.id} userRole="admin" />}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/60 to-slate-950/90 shadow-lg"
            >
              <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light">
                <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
                <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
              </div>
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">{stat.title}</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 border border-white/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950/95 shadow-xl">
        <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base font-semibold">إجراءات سريعة</CardTitle>
          <p className="text-xs text-muted-foreground">ابدأ بأكثر الخطوات استخداماً في إدارة عملك</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/services"
              className="flex items-center gap-3 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-background p-4 transition-colors hover:border-primary/60 hover:bg-primary/10"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">إدارة الخدمات</p>
                <p className="text-sm text-muted-foreground">اضبط عروضك وأسعارك لكل عميل</p>
              </div>
            </Link>
            <Link
              href="/admin/contracts/create"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 p-4 transition-colors hover:border-primary/50 hover:bg-slate-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">عقد جديد</p>
                <p className="text-sm text-muted-foreground">إنشاء عقد احترافي للعميل في ثوانٍ</p>
              </div>
            </Link>
            <Link
              href="/admin/projects"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 p-4 transition-colors hover:border-primary/50 hover:bg-slate-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">إدارة المشاريع</p>
                <p className="text-sm text-muted-foreground">تابع التقدم والتسليمات خطوة بخطوة</p>
              </div>
            </Link>
            <Link
              href="/admin/portfolio"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 p-4 transition-colors hover:border-primary/50 hover:bg-slate-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">إضافة للمعرض</p>
                <p className="text-sm text-muted-foreground">اعرض أفضل أعمالك لزيادة ثقة العملاء</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {isEmptyWorkspace && (
        <Card className="border border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-background to-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold">ابدأ إعداد حسابك في عَقدي</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>أضف خدمتين أو أكثر من صفحة "إدارة الخدمات" لتجهيز عروضك.</li>
              <li>أنشئ أول عقد لك من صفحة "عقد جديد" وأرسله للعميل.</li>
              <li>تابع التنفيذ من صفحة "المشاريع" وأضف التحديثات أولاً بأول.</li>
              <li>انشر أفضل النتائج في "معرض الأعمال" لزيادة ثقة العملاء الجدد.</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
