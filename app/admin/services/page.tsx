import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAllServices } from "@/lib/actions/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ServicesTable } from "@/components/admin/services-table"

export default async function AdminServicesPage() {
  const supabase = await createClient()

  // Role check handled in AdminLayout and Middleware

  // Get all services
  const { data: services } = await getAllServices()

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">إدارة الخدمات</h1>
          <p className="text-muted-foreground mt-2">
            إدارة جميع الخدمات المتاحة للعملاء
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/services/new">
            <Plus className="ml-2 h-4 w-4" />
            إضافة خدمة جديدة
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الخدمات المتاحة</CardTitle>
          <CardDescription>
            {services?.length || 0} خدمة مسجلة في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServicesTable services={services || []} />
        </CardContent>
      </Card>
    </div>
  )
}
