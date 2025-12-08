import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getServiceById } from "@/lib/actions/services"
import { ServiceForm } from "@/components/admin/service-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
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
          <Link href={`/admin/services/${id}`}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة لتفاصيل الخدمة
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">تعديل الخدمة</h1>
        <p className="text-muted-foreground mt-2">
          تعديل تفاصيل الخدمة: {service.name}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الخدمة</CardTitle>
          <CardDescription>
            قم بتعديل البيانات المطلوبة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceForm service={service} mode="edit" />
        </CardContent>
      </Card>
    </div>
  )
}
