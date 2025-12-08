import { ActivationForm } from './activation-form'
import { validateActivationToken } from '@/app/actions/auth-activation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivatePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const resolvedSearchParams = await searchParams

  const tokenParam = resolvedSearchParams.token
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam

  const emailParam = resolvedSearchParams.email
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam

  let isTokenValid = false
  let errorMessage: string | undefined

  if (!token) {
    errorMessage = 'رابط التفعيل غير صالح. يرجى التأكد من الرابط أو طلب رابط جديد.'
  } else {
    const validation = await validateActivationToken(token)
    isTokenValid = validation.success
    if (!validation.success && validation.error) {
      errorMessage = validation.error
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">تفعيل حسابك</CardTitle>
            <CardDescription className="text-base">
              قم بتعيين كلمة مرور آمنة للوصول إلى لوحة التحكم والعقود المرتبطة بحسابك
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!token || !isTokenValid ? (
              <p className="text-sm text-red-500 text-center">
                {errorMessage || 'رابط التفعيل غير صالح أو منتهي الصلاحية.'}
              </p>
            ) : (
              <ActivationForm
                token={token}
                isTokenValid={isTokenValid}
                initialError={errorMessage}
                email={email}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
