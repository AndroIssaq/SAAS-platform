import { getPortfolioProjectById, updatePortfolioProject } from "@/lib/actions/portfolio"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { notFound } from "next/navigation"

interface EditPortfolioProjectPageProps {
  params: {
    id: string
  }
}

export default async function EditPortfolioProjectPage({ params }: EditPortfolioProjectPageProps) {
  const project = await getPortfolioProjectById(params.id)

  if (!project) {
    notFound()
  }

  const updateWithId = updatePortfolioProject.bind(null, params.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/portfolio"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          العودة للمشاريع
        </Link>
        <h1 className="text-3xl font-bold">تعديل المشروع</h1>
        <p className="text-muted-foreground">تعديل معلومات "{project.title}"</p>
      </div>

      {/* Form */}
      <form action={updateWithId}>
        <Card>
          <CardHeader>
            <CardTitle>معلومات المشروع</CardTitle>
            <CardDescription>عدّل البيانات حسب الحاجة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان المشروع (عربي) *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={project.title}
                  placeholder="مثال: متجر الأزياء العصري"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title_en">عنوان المشروع (إنجليزي)</Label>
                <Input
                  id="title_en"
                  name="title_en"
                  defaultValue={project.title_en || ""}
                  placeholder="Example: Modern Fashion Store"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (الرابط) *</Label>
              <Input
                id="slug"
                name="slug"
                required
                defaultValue={project.slug}
                placeholder="modern-fashion-store"
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-muted-foreground">
                استخدم حروف صغيرة وشرطات فقط (مثال: my-project-name)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف *</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={4}
                defaultValue={project.description}
                placeholder="وصف تفصيلي للمشروع..."
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">الفئة *</Label>
                <Select name="category" required defaultValue={project.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="تجارة إلكترونية">تجارة إلكترونية</SelectItem>
                    <SelectItem value="تطبيقات الويب">تطبيقات الويب</SelectItem>
                    <SelectItem value="تطبيقات الموبايل">تطبيقات الموبايل</SelectItem>
                    <SelectItem value="معرض أعمال">معرض أعمال</SelectItem>
                    <SelectItem value="مواقع شخصية">مواقع شخصية</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_name">اسم العميل *</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  required
                  defaultValue={project.client_name}
                  placeholder="شركة المستقبل"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">السنة *</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  required
                  defaultValue={project.year}
                  min="2020"
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>

            {/* Images & Links */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">رابط صورة المشروع</Label>
              <Input
                id="thumbnail_url"
                name="thumbnail_url"
                type="url"
                defaultValue={project.thumbnail_url || ""}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                ارفع الصورة على خدمة مثل Cloudinary أو استخدم رابط خارجي
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="live_url">رابط المشروع المباشر</Label>
                <Input
                  id="live_url"
                  name="live_url"
                  type="url"
                  defaultValue={project.live_url || ""}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github_url">رابط GitHub</Label>
                <Input
                  id="github_url"
                  name="github_url"
                  type="url"
                  defaultValue={project.github_url || ""}
                  placeholder="https://github.com/user/repo"
                />
              </div>
            </div>

            {/* Technologies */}
            <div className="space-y-2">
              <Label htmlFor="technologies">التقنيات المستخدمة *</Label>
              <Input
                id="technologies"
                name="technologies"
                required
                defaultValue={project.technologies?.join(", ") || ""}
                placeholder="Next.js, Tailwind CSS, Supabase"
              />
              <p className="text-xs text-muted-foreground">
                افصل بين التقنيات بفاصلة (مثال: React, Node.js, MongoDB)
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label htmlFor="features">المميزات الرئيسية *</Label>
              <Textarea
                id="features"
                name="features"
                required
                rows={6}
                defaultValue={project.features?.join("\n") || ""}
                placeholder="نظام سلة تسوق متقدم&#10;دفع آمن متعدد الطرق&#10;إدارة المخزون التلقائية"
              />
              <p className="text-xs text-muted-foreground">كل ميزة في سطر جديد</p>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">اللون المميز للمشروع *</Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="color"
                  name="color"
                  type="color"
                  required
                  defaultValue={project.color || "#10b981"}
                  className="w-20 h-10"
                />
                <span className="text-sm text-muted-foreground">
                  اختر لون يمثل المشروع (افتراضي: Emerald Green)
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <Label>الإحصائيات</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">المشاهدات:</span>
                    <span className="font-bold ml-2">{project.views || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                    <span className="font-bold ml-2">
                      {new Date(project.created_at).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Featured */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">الحالة *</Label>
                <Select name="status" defaultValue={project.status} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">منشور</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox id="featured" name="featured" defaultChecked={project.featured} />
                <Label htmlFor="featured" className="cursor-pointer">
                  ⭐ مشروع مميز (يظهر في الصفحة الرئيسية)
                </Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" size="lg" className="bg-emerald-500 hover:bg-emerald-600">
                حفظ التعديلات
              </Button>
              <Button type="button" size="lg" variant="outline" asChild>
                <Link href="/admin/portfolio">إلغاء</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
