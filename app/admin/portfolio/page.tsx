import Link from "next/link"
import { getAllPortfolioProjects } from "@/lib/actions/portfolio"
import { PortfolioProjectsGrid } from "@/components/admin/portfolio-projects-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Sparkles, TrendingUp, Eye, Award } from "lucide-react"

export default async function AdminPortfolioPage() {
  const projects = await getAllPortfolioProjects()

  // Calculate stats
  const stats = {
    total: projects.length,
    published: projects.filter((p: any) => p.status === "published").length,
    draft: projects.filter((p: any) => p.status === "draft").length,
    views: projects.reduce((sum: number, p: any) => sum + (p.views || 0), 0),
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-black to-emerald-600 dark:from-white dark:to-emerald-400 mb-2">
            معرض الأعمال
          </h1>
          <p className="text-muted-foreground text-lg">
            أضف وإدارة المشاريع التي تفخر بها ✨
          </p>
        </div>
        <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
          <Link href="/admin/portfolio/new">
            <Plus className="ml-2 h-5 w-5" />
            إضافة مشروع جديد
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشاريع</CardTitle>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">جميع المشاريع</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">منشورة</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.published}</div>
            <p className="text-xs text-muted-foreground mt-1">مشاريع فعالة</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مسودات</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">قيد العمل</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشاهدات</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.views.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">عدد المشاهدات</p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Grid */}
      <div>
        <PortfolioProjectsGrid projects={projects} />
      </div>
    </div>
  )
}
