import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

export default function AuthSelectionPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 to-background">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">مرحباً بك في عَقدي</h1>
          <p className="text-xl text-muted-foreground">منصة إدارة المشاريع والعقود</p>
        </div>

        <Card className="max-w-md mx-auto hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl">تسجيل الدخول</CardTitle>
            <CardDescription className="text-base">
              سجل دخولك وسيتم توجيهك تلقائياً حسب نوع حسابك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full" size="lg">
              <Link href="/auth/login">تسجيل الدخول</Link>
            </Button>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ليس لديك حساب؟{" "}
                <Link href="/auth/sign-up" className="text-primary underline font-medium">
                  إنشاء حساب جديد
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                النظام يدعم: العملاء • الشركاء • المسؤولين
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
