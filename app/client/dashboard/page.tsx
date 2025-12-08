import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentClient, getClientProjects, logout } from "@/lib/actions"
import { getClientDashboardStats } from "@/lib/actions/project-updates"
import { ProjectStatusCard } from "@/components/dashboard/project-status-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { PendingSignaturesCard } from "@/components/dashboard/pending-signatures-card"
import { ContractsOverviewDashboard } from "@/components/client/contracts-overview-dashboard"
import { ProjectUpdatesFeed } from "@/components/client/project-updates-feed"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle2, TrendingUp, LogOut } from "lucide-react"
import Link from "next/link"

export default async function ClientDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user details from users table
  const { data: userDetails } = await supabase
    .from('users')
    .select('full_name, email, phone')
    .eq('id', user.id)
    .single()

  const clientResult = await getCurrentClient()

  if (!clientResult.success || !clientResult.data) {
    // في حال لم يتم العثور على ملف عميل مرتبط بالمستخدم (لأي سبب)،
    // نحافظ على جلسته ونظهر رسالة لطيفة بدلاً من إرجاعه لصفحة تسجيل الدخول.
    return (
      <div className="space-y-8 max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">مرحباً بك في عَقدي</h1>
        <p className="text-muted-foreground mb-4">
          لا يوجد حالياً ملف عميل مرتبط بحسابك. عندما يرسل لك مزود الخدمة عقداً من خلال عَقدي ويتم ربطه ببريدك
          الإلكتروني، ستظهر لوحتك هنا تلقائياً.
        </p>
      </div>
    )
  }

  const client = clientResult.data

  const projectsResult = await getClientProjects(client.id)
  const projects = projectsResult.success ? projectsResult.data : []

  // Get dashboard stats
  const statsResult = await getClientDashboardStats(client.id)
  const stats = statsResult.success ? statsResult.data : {
    total_contracts: 0,
    completed_contracts: 0,
    pending_contracts: 0,
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0,
    total_contract_value: 0,
    total_updates: 0,
    unread_updates: 0,
  }

  // Calculate project stats
  const activeProjects = projects.filter((p: any) => p.status === "in_progress").length
  const completedProjects = projects.filter((p: any) => p.status === "completed" || p.status === "delivered").length
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum: number, p: any) => sum + (p.progress_percentage || 0), 0) / projects.length,
        )
      : 0

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-primary/70 mb-2">عَقدي • لوحة العميل</p>
          <h1 className="text-3xl font-bold mb-2">مرحباً، {userDetails?.full_name || user.email}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            تابع عقودك، حالة مشاريعك، وآخر التحديثات من فريق العمل في مكان واحد.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right text-xs md:text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{userDetails?.email || user.email}</p>
            {userDetails?.phone && <p className="mt-1">الجوال: {userDetails.phone}</p>}
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm" className="gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </form>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <StatsCard
          title="إجمالي العقود"
          value={stats?.total_contracts || 0}
          icon={FileText}
          description="عقد نشط"
        />
        <StatsCard
          title="عقود مكتملة"
          value={stats?.completed_contracts || 0}
          icon={CheckCircle2}
          description="تم إنجازه"
        />
        <StatsCard
          title="المشاريع النشطة"
          value={stats?.active_projects || 0}
          icon={Clock}
          description="قيد التنفيذ"
        />
        <StatsCard
          title="مشاريع مكتملة"
          value={stats?.completed_projects || 0}
          icon={TrendingUp}
          description="تم تسليمه"
        />
        <StatsCard
          title="تحديثات جديدة"
          value={stats?.unread_updates || 0}
          icon={FileText}
          description="غير مقروءة"
          highlight={stats?.unread_updates ? stats.unread_updates > 0 : false}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contracts Overview - Full Width */}
        <div className="lg:col-span-2">
          {user && <ContractsOverviewDashboard userId={client.id} />}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Project Updates Feed */}
          {user && <ProjectUpdatesFeed clientId={client.id} limit={10} />}

          {/* Pending Signatures */}
          {user && <PendingSignaturesCard userId={user.id} userRole="client" />}
        </div>
      </div>

      {/* Projects Section - Full Width */}
      {projects.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">مشاريعك</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project: any) => (
              <ProjectStatusCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (stats?.total_contracts || 0) === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          لا توجد عقود أو مشاريع مرتبطة بحسابك حتى الآن. عندما يرسل لك مزود الخدمة عقدًا عبر عَقدي ويبدأ تنفيذ
          المشروع، ستظهر العقود والتحديثات هنا تلقائيًا.
        </div>
      )}
    </div>
  )
}
