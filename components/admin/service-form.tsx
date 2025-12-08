"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Save } from "lucide-react"
import { createService, updateService } from "@/lib/actions/services"
import { toast } from "sonner"
import { SERVICE_CATEGORIES, PRICE_TYPES, type Service } from "@/lib/types/service"

const serviceSchema = z.object({
  name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  name_en: z.string().optional(),
  category: z.string(),
  description: z.string().optional(),
  description_en: z.string().optional(),
  base_price: z.number().min(0, "السعر يجب أن يكون أكبر من 0"),
  currency: z.string().default("EGP"),
  price_type: z.string().default("fixed"),
  timeline: z.string().optional(),
  timeline_days: z.number().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  display_order: z.number().default(0),
})

type ServiceFormData = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  service?: Service
  mode?: "create" | "edit"
}

export function ServiceForm({ service, mode = "create" }: ServiceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [features, setFeatures] = useState<string[]>(service?.features || [])
  const [deliverables, setDeliverables] = useState<string[]>(service?.deliverables || [])
  const [newFeature, setNewFeature] = useState("")
  const [newDeliverable, setNewDeliverable] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service || {
      currency: "EGP",
      price_type: "fixed",
      is_active: true,
      is_featured: false,
      display_order: 0,
    },
  })

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true)

    const serviceData = {
      ...data,
      features,
      deliverables,
    }

    try {
      if (mode === "edit" && service) {
        const result = await updateService({ id: service.id, ...serviceData })
        if (result.success) {
          toast.success(result.message)
          router.push("/admin/services")
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createService(serviceData)
        if (result.success) {
          toast.success(result.message)
          router.push("/admin/services")
        } else {
          toast.error(result.error)
        }
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الخدمة")
    } finally {
      setIsSubmitting(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      setDeliverables([...deliverables, newDeliverable.trim()])
      setNewDeliverable("")
    }
  }

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الخدمة (بالعربية) *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="مثال: تصميم موقع إلكتروني"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name_en">اسم الخدمة (بالإنجليزية)</Label>
            <Input
              id="name_en"
              {...register("name_en")}
              placeholder="Example: Website Design"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">الفئة *</Label>
          <Select
            onValueChange={(value) => setValue("category", value)}
            defaultValue={service?.category}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الفئة" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label} ({cat.label_en})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">الوصف (بالعربية)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="وصف تفصيلي للخدمة"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_en">الوصف (بالإنجليزية)</Label>
            <Textarea
              id="description_en"
              {...register("description_en")}
              placeholder="Detailed service description"
              rows={4}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">التسعير</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base_price">السعر الأساسي *</Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              {...register("base_price", { valueAsNumber: true })}
              placeholder="15000"
            />
            {errors.base_price && (
              <p className="text-sm text-destructive">{errors.base_price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">العملة</Label>
            <Select
              onValueChange={(value) => setValue("currency", value)}
              defaultValue={service?.currency || "EGP"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                <SelectItem value="USD">دولار (USD)</SelectItem>
                <SelectItem value="EUR">يورو (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_type">نوع السعر</Label>
            <Select
              onValueChange={(value) => setValue("price_type", value)}
              defaultValue={service?.price_type || "fixed"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">المدة الزمنية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timeline">المدة (نص)</Label>
            <Input
              id="timeline"
              {...register("timeline")}
              placeholder="مثال: 2-4 أسابيع"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline_days">المدة (بالأيام)</Label>
            <Input
              id="timeline_days"
              type="number"
              {...register("timeline_days", { valueAsNumber: true })}
              placeholder="28"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">المميزات</h3>
        
        <div className="flex gap-2">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="أضف ميزة جديدة"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
          />
          <Button type="button" onClick={addFeature} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <span className="flex-1">{feature}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFeature(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Deliverables */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">المخرجات</h3>
        
        <div className="flex gap-2">
          <Input
            value={newDeliverable}
            onChange={(e) => setNewDeliverable(e.target.value)}
            placeholder="أضف مخرج جديد"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addDeliverable())}
          />
          <Button type="button" onClick={addDeliverable} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {deliverables.map((deliverable, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <span className="flex-1">{deliverable}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDeliverable(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">الإعدادات</h3>
        
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex-1">
            <Label htmlFor="is_active" className="text-base font-semibold cursor-pointer">
              نشط
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              هل الخدمة متاحة للعملاء؟
            </p>
          </div>
          <Switch
            id="is_active"
            defaultChecked={service?.is_active ?? true}
            onCheckedChange={(checked) => setValue("is_active", checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex-1">
            <Label htmlFor="is_featured" className="text-base font-semibold cursor-pointer">
              مميزة
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              عرض الخدمة كخدمة مميزة
            </p>
          </div>
          <Switch
            id="is_featured"
            defaultChecked={service?.is_featured ?? false}
            onCheckedChange={(checked) => setValue("is_featured", checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_order">ترتيب العرض</Label>
          <Input
            id="display_order"
            type="number"
            {...register("display_order", { valueAsNumber: true })}
            placeholder="0"
          />
          <p className="text-sm text-muted-foreground">
            الخدمات ذات الترتيب الأقل تظهر أولاً
          </p>
        </div>
      </div>

      <Separator />

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          <Save className="ml-2 h-4 w-4" />
          {isSubmitting ? "جاري الحفظ..." : mode === "edit" ? "تحديث الخدمة" : "إضافة الخدمة"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          إلغاء
        </Button>
      </div>
    </form>
  )
}
