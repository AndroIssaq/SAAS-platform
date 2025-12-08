import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-md">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">تم إنشاء الحساب بنجاح!</CardTitle>
            <CardDescription className="text-base">
              تم إرسال رسالة تأكيد إلى بريدك الإلكتروني لتفعيل حسابك في عَقدي
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              يرجى التحقق من بريدك الإلكتروني والنقر على رابط التأكيد لتفعيل حسابك كمالك Workspace.
            </p>
            <p className="text-sm text-muted-foreground">
              بعد تفعيل البريد الإلكتروني، قم بتسجيل الدخول ليتم نقلك إلى لوحة التحكم الخاصة بمساحة عملك.
            </p>
            <p className="text-xs text-muted-foreground">إذا لم تجد الرسالة، تحقق من مجلد الرسائل غير المرغوب فيها.</p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/auth/login">العودة إلى تسجيل الدخول</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
