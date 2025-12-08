import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react"
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
  pending: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-yellow-100 text-yellow-800",
  revision: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  delivered: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const project = await getProjectById(id)

  if (!project) {
    notFound()
  }

  const deliverables = project.deliverables || []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/client/dashboard">
              <ArrowLeft className="ml-2" />
              العودة للوحة التحكم
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Project Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl mb-2">{project.project_name}</CardTitle>
                  <CardDescription className="text-lg">{project.project_type}</CardDescription>
                </div>
                <Badge className={statusColors[project.status]}>{statusLabels[project.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">التقدم الإجمالي</span>
                  <span className="font-semibold text-primary text-lg">{project.progress_percentage}%</span>
                </div>
                <Progress value={project.progress_percentage} className="h-3" />
              </div>

              <Separator />

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">تاريخ البداية</span>
                  </div>
                  <p className="font-medium">{formatDate(project.start_date)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">التسليم المتوقع</span>
                  </div>
                  <p className="font-medium">{formatDate(project.expected_delivery_date)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">رقم العقد</span>
                  </div>
                  <p className="font-medium">{project.contract.contract_number}</p>
                </div>
              </div>

              {project.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">وصف المشروع</h3>
                    <p className="text-muted-foreground leading-relaxed">{project.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Deliverables */}
          <Card>
            <CardHeader>
              <CardTitle>المخرجات والتسليمات</CardTitle>
              <CardDescription>الملفات والمخرجات المتعلقة بالمشروع</CardDescription>
            </CardHeader>
            <CardContent>
              {deliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد تسليمات متاحة حالياً</p>
              ) : (
                <div className="space-y-3">
                  {deliverables.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 ml-2" />
                        تحميل
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication */}
          <Card>
            <CardHeader>
              <CardTitle>التواصل والملاحظات</CardTitle>
              <CardDescription>تواصل مع فريق العمل</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">لديك استفسار أو ملاحظة؟</p>
                <Button>
                  <MessageSquare className="w-4 h-4 ml-2" />
                  إرسال رسالة
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {project.notes && (
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{project.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
