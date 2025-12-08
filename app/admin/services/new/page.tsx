import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ServiceForm } from "@/components/admin/service-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewServicePage() {
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
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/services">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للخدمات
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">إضافة خدمة جديدة</h1>
        <p className="text-muted-foreground mt-2">
          أضف خدمة جديدة لتكون متاحة للعملاء والشركاء
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الخدمة</CardTitle>
          <CardDescription>
            املأ جميع البيانات المطلوبة لإنشاء الخدمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceForm />
        </CardContent>
      </Card>
    </div>
  )
}
