"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const planCode = searchParams.get("plan") || "small_office_monthly"

  const planLabel =
    planCode === "small_office_monthly"
      ? "خطة المكاتب الصغيرة"
      : planCode === "company_monthly"
      ? "خطة الشركات الكبيرة"
      : planCode === "enterprise"
      ? "خطة Enterprise"
      : "الخطة المجانية"

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("كلمات المرور غير متطابقة")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            role: "admin", // Workspace owner/admin
            billing_plan: planCode,
          },
        },
      })

      if (error) throw error

      router.push("/auth/sign-up-success")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الحساب")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">ابدأ رحلتك مع عَقدي</CardTitle>
              <CardDescription className="text-base">
                أنشئ حساب مالك Workspace لإدارة العقود والمشاريع والتواصل مع عملائك في مكان واحد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground text-center">
                    <span className="font-medium text-foreground">الخطة المختارة: {planLabel}</span>
                    <span className="mx-1">•</span>
                    <span>يمكنك تعديل الخطة لاحقًا من داخل لوحة التحكم.</span>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fullName" className="text-right">
                      الاسم الكامل
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="أحمد محمد"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-right">
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-right">
                      كلمة المرور
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password" className="text-right">
                      تأكيد كلمة المرور
                    </Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري إنشاء الحساب...
                      </>
                    ) : (
                      "إنشاء حساب"
                    )}
                  </Button>
                </div>
                <p className="mt-4 text-xs text-center text-muted-foreground">
                  بعد إنشاء الحساب ستصلك رسالة تأكيد بريد إلكتروني، وبمجرد تفعيل البريد سنقوم بإعداد مساحة العمل الخاصة بك
                </p>
                <div className="mt-6 text-center text-sm">
                  لديك حساب بالفعل؟{" "}
                  <Link href="/auth/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    تسجيل الدخول
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
