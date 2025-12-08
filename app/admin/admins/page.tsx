import { redirect } from "next/navigation"
import { isSuperAdmin, getAllAdmins } from "@/lib/actions/super-admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Crown, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function AdminsManagementPage() {
  const isSuper = await isSuperAdmin()

  if (!isSuper) {
    redirect("/admin")
  }

  const admins = await getAllAdmins()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">إدارة المسؤولين</h1>
          <p className="text-muted-foreground">عرض وإدارة حسابات المسؤولين</p>
        </div>
      </div>

      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Crown className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-700">صلاحيات المسؤول الرئيسي</AlertTitle>
        <AlertDescription className="text-amber-600">
          أنت المسؤول الرئيسي الوحيد الذي يمكنه إضافة أو إزالة مسؤولين آخرين
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            قائمة المسؤولين
          </CardTitle>
          <CardDescription>جميع المستخدمين الذين لديهم صلاحيات إدارية</CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد مسؤولين آخرين</p>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{admin.full_name || admin.email}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.email === "androisshaq@gmail.com" && (
                      <Badge className="bg-amber-500">
                        <Crown className="w-3 h-3 ml-1" />
                        المسؤول الرئيسي
                      </Badge>
                    )}
                    <Badge variant="outline">مسؤول</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>كيفية إضافة مسؤول جديد</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          <p>لإضافة مسؤول جديد، اتبع الخطوات التالية:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>اذهب إلى Supabase Dashboard → Authentication → Users</li>
            <li>اضغط "Add User" وأدخل البريد الإلكتروني وكلمة المرور</li>
            <li>بعد إنشاء المستخدم، انسخ الـ User ID</li>
            <li>اذهب إلى SQL Editor وشغل هذا الكود:</li>
          </ol>
          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto mt-2">
{`-- استبدل EMAIL ببريد المسؤول الجديد
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb 
WHERE email = 'EMAIL';

-- أضف السجل في جدول users
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
FROM auth.users
WHERE email = 'EMAIL'
ON CONFLICT (id) DO UPDATE SET role = 'admin';`}
          </pre>
        </AlertDescription>
      </Alert>
    </div>
  )
}
