"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink, Edit, Trash2, Eye, EyeOff, Search, Filter, ArrowUpDown, Info, CheckSquare, Square, Calendar, Tag, TrendingUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deletePortfolioProject, toggleProjectStatus } from "@/lib/actions/portfolio"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PortfolioQuickView } from "@/components/admin/portfolio-quick-view"
import { Checkbox } from "@/components/ui/checkbox"

interface PortfolioProject {
  id: string
  title: string
  title_en?: string
  slug: string
  category: string
  description: string
  client_name: string
  year: number
  thumbnail_url?: string
  technologies?: string[]
  features?: string[]
  color?: string
  live_url: string | null
  github_url?: string | null
  status: string
  featured: boolean
  views: number
  created_at: string
}

interface PortfolioProjectsGridProps {
  projects: PortfolioProject[]
}

export function PortfolioProjectsGrid({ projects }: PortfolioProjectsGridProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "views" | "title">("date")
  const [quickViewProject, setQuickViewProject] = useState<PortfolioProject | null>(null)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id)
      await deletePortfolioProject(id)
      toast.success("تم حذف المشروع بنجاح")
      router.refresh()
    } catch (error) {
      toast.error("فشل حذف المشروع")
    } finally {
      setIsDeleting(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      setIsToggling(id)
      await toggleProjectStatus(id, currentStatus)
      toast.success("تم تغيير حالة المشروع")
      router.refresh()
    } catch (error) {
      toast.error("فشل تغيير حالة المشروع")
    } finally {
      setIsToggling(null)
    }
  }

  const toggleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set())
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)))
    }
  }

  const toggleSelectProject = (id: string) => {
    const newSelected = new Set(selectedProjects)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedProjects(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) return
    
    try {
      setIsBulkDeleting(true)
      const deletePromises = Array.from(selectedProjects).map(id => deletePortfolioProject(id))
      await Promise.all(deletePromises)
      toast.success(`تم حذف ${selectedProjects.size} مشروع بنجاح`)
      setSelectedProjects(new Set())
      router.refresh()
    } catch (error) {
      toast.error("فشل حذف بعض المشاريع")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkPublish = async () => {
    if (selectedProjects.size === 0) return
    
    try {
      const togglePromises = Array.from(selectedProjects).map(id => {
        const project = filteredProjects.find(p => p.id === id)
        if (project && project.status === "draft") {
          return toggleProjectStatus(id, "draft")
        }
        return Promise.resolve()
      })
      await Promise.all(togglePromises)
      toast.success("تم نشر المشاريع بنجاح")
      setSelectedProjects(new Set())
      router.refresh()
    } catch (error) {
      toast.error("فشل نشر بعض المشاريع")
    }
  }

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.category)))
  }, [projects])

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === "views") {
        return (b.views || 0) - (a.views || 0)
      } else {
        return a.title.localeCompare(b.title, "ar")
      }
    })

    return filtered
  }, [projects, searchQuery, statusFilter, categoryFilter, sortBy])

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/20 p-6 mb-4">
            <Tag className="h-12 w-12 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">لا توجد مشاريع بعد</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            ابدأ بإضافة أول مشروع لك في معرض الأعمال
          </p>
          <Button asChild className="bg-gradient-to-r from-emerald-500 to-emerald-600">
            <Link href="/admin/portfolio/new">
              <Plus className="ml-2 h-4 w-4" />
              إضافة مشروع جديد
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مشروع، عميل، أو slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="ml-2 h-4 w-4" />
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="published">منشور</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="ml-2 h-4 w-4" />
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <ArrowUpDown className="ml-2 h-4 w-4" />
            <SelectValue placeholder="الترتيب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">الأحدث</SelectItem>
            <SelectItem value="views">الأكثر مشاهدة</SelectItem>
            <SelectItem value="title">الاسم (أ-ي)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count & Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            عرض {filteredProjects.length} من {projects.length} مشروع
            {selectedProjects.size > 0 && (
              <span className="mr-2 text-emerald-600 font-medium">
                • تم اختيار {selectedProjects.size}
              </span>
            )}
          </div>
          
          {filteredProjects.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={toggleSelectAll}
              className="h-8"
            >
              {selectedProjects.size === filteredProjects.length ? (
                <>
                  <CheckSquare className="ml-2 h-4 w-4" />
                  إلغاء تحديد الكل
                </>
              ) : (
                <>
                  <Square className="ml-2 h-4 w-4" />
                  تحديد الكل
                </>
              )}
            </Button>
          )}
        </div>

        {selectedProjects.size > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkPublish}
            >
              <Eye className="ml-2 h-4 w-4" />
              نشر المحدد
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isBulkDeleting}
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف المحدد ({selectedProjects.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الحذف الجماعي</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من حذف {selectedProjects.size} مشروع؟ هذا الإجراء لا يمكن التراجع عنه.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    حذف الكل
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد نتائج مطابقة</h3>
            <p className="text-sm text-muted-foreground">
              جرب تغيير معايير البحث أو الفلترة
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className={`group relative overflow-hidden transition-all hover:shadow-xl ${
                selectedProjects.has(project.id) ? "ring-2 ring-emerald-500 shadow-lg" : ""
              }`}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-3 right-3 z-10">
                <Checkbox
                  checked={selectedProjects.has(project.id)}
                  onCheckedChange={() => toggleSelectProject(project.id)}
                  className="bg-white/90 backdrop-blur-sm border-2"
                />
              </div>

              {/* Thumbnail */}
              <div 
                className="relative h-48 overflow-hidden"
                style={{
                  background: project.color 
                    ? `linear-gradient(135deg, ${project.color}15 0%, ${project.color}30 100%)`
                    : 'linear-gradient(135deg, rgb(243 244 246) 0%, rgb(229 231 235) 100%)'
                }}
              >
                {project.thumbnail_url ? (
                  <Image
                    src={project.thumbnail_url}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Tag className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge
                    variant={project.status === "published" ? "default" : "secondary"}
                    className={
                      project.status === "published"
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : ""
                    }
                  >
                    {project.status === "published" ? "منشور" : "مسودة"}
                  </Badge>
                </div>

                {/* Featured Badge */}
                {project.featured && (
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-yellow-500 text-white">
                      ⭐ مميز
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">/{project.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {project.category}
                  </Badge>
                  <span>•</span>
                  <span>{project.year}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">العميل:</span>
                  <span className="font-medium">{project.client_name}</span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{project.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(project.created_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                </div>

                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.slice(0, 3).map((tech, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.technologies.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-2 pt-4 border-t bg-muted/30">
                {/* Quick Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
                    onClick={() => {
                      setQuickViewProject(project)
                      setQuickViewOpen(true)
                    }}
                    title="عرض سريع"
                  >
                    <Info className="h-4 w-4" />
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                    title="عرض في المعرض"
                  >
                    <Link href={`/portfolio/${project.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                    onClick={() => handleToggleStatus(project.id, project.status)}
                    disabled={isToggling === project.id}
                    title={project.status === "published" ? "إخفاء" : "نشر"}
                  >
                    {project.status === "published" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Edit & Delete */}
                <div className="flex items-center gap-1">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8"
                  >
                    <Link href={`/admin/portfolio/${project.id}/edit`}>
                      <Edit className="h-3 w-3 ml-1" />
                      تعديل
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isDeleting === project.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف المشروع "{project.title}"؟ هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(project.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Quick View Dialog */}
      <PortfolioQuickView
        project={quickViewProject}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </div>
  )
}
