import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAllServices } from "@/lib/actions/services"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, DollarSign, Clock, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AffiliateServicesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }
  
  // Check if user is affiliate
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .single()
  
  if (!affiliate) {
    redirect("/")
  }
  
  // Get all active services
  const { data: services } = await getAllServices({ activeOnly: true })
  
  // Group services by category
  const servicesByCategory = services?.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, typeof services>)
  
  const categoryLabels: Record<string, string> = {
    'web-development': 'تطوير المواقع',
    'mobile-app': 'تطبيقات الموبايل',
    'design': 'التصميم',
    'marketing': 'التسويق',
    'consulting': 'الاستشارات',
    'custom': 'خدمات مخصصة',
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/affiliate/dashboard">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للوحة التحكم
          </Link>
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              الخدمات المتاحة
            </h1>
            <p className="text-muted-foreground mt-2">
              تصفح جميع الخدمات واستخدمها عند إنشاء عقد جديد
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/affiliate/contracts/new">
              إنشاء عقد جديد
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Featured Services */}
      {services?.some(s => s.is_featured) && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            الخدمات المميزة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services?.filter(s => s.is_featured).map((service) => (
              <ServiceCard key={service.id} service={service} featured />
            ))}
          </div>
        </div>
      )}
      
      {/* Services by Category */}
      <div className="space-y-8">
        {servicesByCategory && Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          <div key={category}>
            <h2 className="text-2xl font-bold mb-4">
              {categoryLabels[category] || category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryServices?.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {(!services || services.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا توجد خدمات متاحة حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ServiceCard({ service, featured = false }: { service: any; featured?: boolean }) {
  return (
    <Card className={`hover:shadow-lg transition-all ${featured ? 'border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-transparent' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{service.name}</CardTitle>
            {service.name_en && (
              <p className="text-sm text-muted-foreground mt-1">{service.name_en}</p>
            )}
          </div>
          {featured && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600">
              مميزة
            </Badge>
          )}
        </div>
        {service.description && (
          <CardDescription className="line-clamp-2 mt-2">
            {service.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price */}
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-xs text-muted-foreground">السعر</p>
            <p className="font-bold text-lg text-emerald-700">
              {service.base_price.toLocaleString('ar-EG')} {service.currency}
            </p>
          </div>
        </div>
        
        {/* Timeline */}
        {service.timeline && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">المدة المتوقعة</p>
              <p className="font-semibold text-blue-700">{service.timeline}</p>
            </div>
          </div>
        )}
        
        {/* Features */}
        {service.features && service.features.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">المميزات:</p>
            <ul className="space-y-1">
              {service.features.slice(0, 3).map((feature: string, index: number) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
              {service.features.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{service.features.length - 3} مميزات أخرى
                </li>
              )}
            </ul>
          </div>
        )}
        
        {/* Stats */}
        {service.total_contracts > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              تم استخدامها في {service.total_contracts} عقد
            </p>
          </div>
        )}
        
        {/* Action */}
        <Button asChild className="w-full" variant={featured ? "default" : "outline"}>
          <Link href={`/affiliate/contracts/new?service=${service.id}`}>
            استخدم هذه الخدمة
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
