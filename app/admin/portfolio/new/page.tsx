"use client"

import { useState } from "react"
import { createPortfolioProject } from "@/lib/actions/portfolio"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { ArrowRight, Sparkles, Wand2 } from "lucide-react"
import { toast } from "sonner"

export default function NewPortfolioProjectPage() {
  const currentYear = new Date().getFullYear()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    // Auto-generate slug only if slug is empty or matches previous auto-generated slug
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      await createPortfolioProject(formData)
      toast.success("تم إضافة المشروع بنجاح! 🎉")
    } catch (error) {
      toast.error("فشل إضافة المشروع")
      setIsSubmitting(false)
    }
  }

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
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-emerald-500" />
          <h1 className="text-3xl font-bold">إضافة مشروع جديد</h1>
        </div>
        <p className="text-muted-foreground">أضف مشروعاً جديداً لمعرض الأعمال</p>
      </div>

      {/* Form */}
      <form action={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>معلومات المشروع</CardTitle>
            <CardDescription>املأ جميع البيانات المطلوبة</CardDescription>
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
                  placeholder="مثال: متجر الأزياء العصري"
                  value={title}
                  onChange={handleTitleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title_en">عنوان المشروع (إنجليزي)</Label>
                <Input id="title_en" name="title_en" placeholder="Example: Modern Fashion Store" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="flex items-center gap-2">
                Slug (الرابط) *
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setSlug(generateSlug(title))}
                  disabled={!title}
                >
                  <Wand2 className="w-3 h-3 ml-1" />
                  توليد تلقائي
                </Button>
              </Label>
              <Input
                id="slug"
                name="slug"
                required
                placeholder="modern-fashion-store"
                pattern="[a-z0-9-]+"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                استخدم حروف صغيرة وشرطات فقط • سيكون الرابط: /portfolio/{slug || "..."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف *</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="وصف تفصيلي للمشروع..."
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">الفئة *</Label>
                <Select name="category" required>
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
                <Input id="client_name" name="client_name" required placeholder="شركة المستقبل" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">السنة *</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  required
                  defaultValue={currentYear}
                  min="2020"
                  max={currentYear + 1}
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
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                ارفع الصورة على خدمة مثل Cloudinary أو استخدم رابط خارجي
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="live_url">رابط المشروع المباشر</Label>
                <Input id="live_url" name="live_url" type="url" placeholder="https://example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github_url">رابط GitHub</Label>
                <Input
                  id="github_url"
                  name="github_url"
                  type="url"
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
                placeholder="نظام سلة تسوق متقدم&#10;دفع آمن متعدد الطرق&#10;إدارة المخزون التلقائية"
              />
              <p className="text-xs text-muted-foreground">
                كل ميزة في سطر جديد
              </p>
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
                  defaultValue="#10b981"
                  className="w-20 h-10"
                />
                <span className="text-sm text-muted-foreground">
                  اختر لون يمثل المشروع (افتراضي: Emerald Green)
                </span>
              </div>
            </div>

            {/* Status & Featured */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">الحالة *</Label>
                <Select name="status" defaultValue="draft" required>
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
                <Checkbox id="featured" name="featured" />
                <Label htmlFor="featured" className="cursor-pointer">
                  ⭐ مشروع مميز (يظهر في الصفحة الرئيسية)
                </Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin ml-2">⏳</span>
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Sparkles className="ml-2 h-5 w-5" />
                    إضافة المشروع
                  </>
                )}
              </Button>
              <Button type="button" size="lg" variant="outline" asChild disabled={isSubmitting}>
                <Link href="/admin/portfolio">إلغاء</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
