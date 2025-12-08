"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface ActivationFormProps {
  token: string
  isTokenValid: boolean
  initialError?: string
  email?: string
}

export function ActivationForm({ token, isTokenValid, initialError, email }: ActivationFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(initialError || null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  if (!token || !isTokenValid) {
    return (
      <p className="text-sm text-red-500 text-center mt-4">
        {error || 'رابط التفعيل غير صالح أو منتهي الصلاحية.'}
      </p>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError('يرجى إدخال كلمة المرور وتأكيدها')
      return
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/activation/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'فشل في تفعيل الحساب')
        return
      }

      // إذا كان الإيميل متوفر من رابط التفعيل، قم بتسجيل الدخول تلقائياً ثم توجيه المستخدم للوحة العميل
      if (email) {
        const supabase = createClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          console.error('Auto login after activation failed:', signInError)
          setError(signInError.message || 'تم تفعيل الحساب ولكن فشل تسجيل الدخول تلقائياً')
          return
        }

        toast.success('تم تفعيل الحساب وتسجيل الدخول بنجاح', {
          description: 'تم توجيهك إلى لوحة التحكم الخاصة بك كعميل',
        })

        router.push('/client/dashboard')
        router.refresh()
        return
      }

      // في حال عدم توفر الإيميل (لروابط قديمة)، نحافظ على السلوك القديم
      toast.success('تم تفعيل الحساب بنجاح', {
        description: 'يمكنك الآن تسجيل الدخول باستخدام بريدك وكلمة المرور الجديدة',
      })

      router.push('/auth/login?activated=1')
    } catch (err: any) {
      console.error('Activation form error:', err)
      setError('حدث خطأ غير متوقع أثناء تفعيل الحساب')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="grid gap-2">
        <Label htmlFor="password" className="text-right">
          كلمة المرور الجديدة
        </Label>
        <Input
          id="password"
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword" className="text-right">
          تأكيد كلمة المرور
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          dir="ltr"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
        {isLoading ? 'جاري تفعيل الحساب...' : 'تعيين كلمة المرور وتفعيل الحساب'}
      </Button>
    </form>
  )
}
