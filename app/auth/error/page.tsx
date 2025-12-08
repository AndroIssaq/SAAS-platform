import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-md">
        <Card className="border-red-500/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-red-500">خطأ في المصادقة</CardTitle>
            <CardDescription className="text-base">حدث خطأ أثناء تسجيل الدخول</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-center text-muted-foreground">
              عذراً، حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/auth/login">تسجيل الدخول</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/">العودة للرئيسية</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
