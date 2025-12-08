import { notFound } from "next/navigation"
import { getClientById } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AdminClientDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminClientDetailsPage({ params }: AdminClientDetailsPageProps) {
  const { id } = await params
  const result = await getClientById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const client = result.data as any

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل العميل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">اسم الشركة</span>
            <span className="font-medium">{client.company_name || "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">البريد الإلكتروني</span>
            <span className="font-medium">{client.users?.email || "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">رقم الهاتف</span>
            <span className="font-medium">{client.users?.phone || "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">المجال</span>
            <span className="font-medium">{client.industry || "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الموقع الإلكتروني</span>
            <span className="font-medium">{client.website_url || "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الحالة</span>
            <Badge variant={client.onboarding_completed ? "default" : "secondary"}>
              {client.onboarding_completed ? "نشط" : "غير نشط"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
