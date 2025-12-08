"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ExternalLink, Edit, Trash2, Eye, EyeOff, Search, Filter, ArrowUpDown, Info, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  github_url?: string
  status: string
  featured: boolean
  views: number
  created_at: string
}

interface PortfolioProjectsTableProps {
  projects: PortfolioProject[]
}

export function PortfolioProjectsTable({ projects }: PortfolioProjectsTableProps) {
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
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">لا توجد مشاريع بعد</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
        <div className="text-sm text-muted-foreground">
          عرض {filteredProjects.length} من {projects.length} مشروع
          {selectedProjects.size > 0 && (
            <span className="mr-2 text-emerald-600 font-medium">
              • تم اختيار {selectedProjects.size}
            </span>
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

      {/* Table */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleSelectAll}
              >
                {selectedProjects.size === filteredProjects.length && filteredProjects.length > 0 ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
            </TableHead>
            <TableHead>المشروع</TableHead>
            <TableHead>الفئة</TableHead>
            <TableHead>العميل</TableHead>
            <TableHead>السنة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>المشاهدات</TableHead>
            <TableHead className="text-left">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjects.map((project) => (
            <TableRow key={project.id} className={selectedProjects.has(project.id) ? "bg-emerald-50 dark:bg-emerald-950/20" : ""}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => toggleSelectProject(project.id)}
                >
                  {selectedProjects.has(project.id) ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">/{project.slug}</p>
                  </div>
                  {project.featured && (
                    <Badge variant="secondary" className="text-xs">⭐ مميز</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{project.category}</Badge>
              </TableCell>
              <TableCell>{project.client_name}</TableCell>
              <TableCell>{project.year}</TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {project.views || 0} مشاهدة
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 justify-end">
                  {/* Quick View */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setQuickViewProject(project)
                      setQuickViewOpen(true)
                    }}
                  >
                    <Info className="h-4 w-4" />
                  </Button>

                  {/* View Project */}
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Link href={`/portfolio/${project.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>

                  {/* Toggle Status */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToggleStatus(project.id, project.status)}
                    disabled={isToggling === project.id}
                  >
                    {project.status === "published" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Edit */}
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Link href={`/admin/portfolio/${project.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
