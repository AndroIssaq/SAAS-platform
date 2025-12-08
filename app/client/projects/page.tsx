import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentClient } from "@/lib/actions/onboarding"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FolderKanban, Calendar, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import Link from "next/link"

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  in_progress: "قيد التنفيذ",
  review: "قيد المراجعة",
  revision: "قيد التعديل",
  completed: "مكتمل",
  delivered: "تم التسليم",
  cancelled: "ملغي",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-purple-100 text-purple-800",
  revision: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
}

export default async function ClientProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const clientResult = await getCurrentClient()

  if (!clientResult.success || !clientResult.data) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">مشاريعي</h1>
        <p className="text-muted-foreground mb-4">
          لا يوجد حالياً ملف عميل مرتبط بحسابك، لذلك لا يمكن عرض مشاريع.
          عندما يرسل لك مزود الخدمة عقداً ويبدأ تنفيذ مشروع مرتبط ببريدك الإلكتروني، ستظهر المشاريع هنا تلقائياً.
        </p>
      </div>
    )
  }

  const client = clientResult.data

  // Get client's projects
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      contract:contracts(contract_number)
    `)
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">مشاريعي</h1>
        <p className="text-muted-foreground">جميع المشاريع الخاصة بك</p>
      </div>

      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد مشاريع حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects.map((project: any) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderKanban className="w-5 h-5 text-primary" />
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-2">{project.description}</CardDescription>
                  </div>
                  <Badge className={statusColors[project.status]}>
                    {statusLabels[project.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>البداية: {formatDate(project.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>التسليم: {formatDate(project.expected_delivery_date)}</span>
                  </div>
                  {project.contract && (
                    <div className="text-sm text-muted-foreground">
                      <span>العقد: {project.contract.contract_number}</span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">التقدم</span>
                    <span className="text-sm text-muted-foreground">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>

                <Button variant="outline" size="sm" asChild>
                  <Link href={`/client/project/${project.id}`}>عرض التفاصيل</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
