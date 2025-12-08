import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getServiceById } from "@/lib/actions/services"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, DollarSign, Clock, CheckCircle, Sparkles } from "lucide-react"
import Link from "next/link"

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }
  
  // Check if user is admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (userData?.role !== "admin") {
    redirect("/")
  }
  
  const { data: service } = await getServiceById(id)
  
  if (!service) {
    notFound()
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/services">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للخدمات
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {service.name}
              {service.is_featured && (
                <Sparkles className="h-6 w-6 text-yellow-500" />
              )}
            </h1>
            {service.name_en && (
              <p className="text-muted-foreground mt-1">{service.name_en}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={service.is_active ? "default" : "secondary"}>
              {service.is_active ? "نشط" : "غير نشط"}
            </Badge>
            <Button asChild>
              <Link href={`/admin/services/${id}/edit`}>
                <Edit className="ml-2 h-4 w-4" />
                تعديل
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle>نظرة عامة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-sm text-muted-foreground">السعر</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {service.base_price.toLocaleString('ar-EG')} {service.currency}
                  </p>
                </div>
              </div>
              
              {service.timeline && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">المدة</p>
                    <p className="text-xl font-bold text-blue-700">{service.timeline}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <Badge className="mb-2">{service.category}</Badge>
              <p className="text-sm text-muted-foreground">نوع السعر: {service.price_type}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Description */}
        {service.description && (
          <Card>
            <CardHeader>
              <CardTitle>الوصف</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{service.description}</p>
              {service.description_en && (
                <p className="mt-4 text-muted-foreground whitespace-pre-wrap">{service.description_en}</p>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Features */}
        {service.features && service.features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>المميزات</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {/* Deliverables */}
        {service.deliverables && service.deliverables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>المخرجات</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {service.deliverables.map((deliverable, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="font-bold text-primary">{index + 1}.</span>
                    <span>{deliverable}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">عدد العقود</p>
                <p className="text-2xl font-bold">{service.total_contracts}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">
                  {service.total_revenue.toLocaleString('ar-EG')} {service.currency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
