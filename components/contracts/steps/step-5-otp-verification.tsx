'use client'

import { useState, useEffect } from 'react'
import { useContractWorkflowStore } from '@/lib/stores/contract-workflow-store'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Loader2, Check, AlertCircle, RefreshCw, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface OTPVerificationProps {
  contractId: string
  clientEmail: string
  isVerified?: boolean
}

export function OTPVerification({ contractId, clientEmail, isVerified }: OTPVerificationProps) {
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const { updateContractStep } = useContractWorkflowStore()

  // Countdown timer
  useEffect(() => {
    if (!otpSent || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setOtpSent(false)
          return 600
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [otpSent, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const sendOTP = async () => {
    setSending(true)

    try {
      const response = await fetch(`/api/contracts/${contractId}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'فشل في إرسال رمز التحقق')
      }

      setOtpSent(true)
      setTimeLeft(600)
      toast.success('✅ تم إرسال رمز التحقق!', {
        description: `تحقق من بريدك الإلكتروني: ${clientEmail}`
      })

      // In development, show OTP in console
      if (result.otp && process.env.NODE_ENV === 'development') {
        console.log('🔐 OTP Code (DEV ONLY):', result.otp)
        toast.info('في وضع التطوير: ' + result.otp, {
          duration: 10000
        })
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error)
      toast.error('حدث خطأ في إرسال رمز التحقق', {
        description: error.message
      })
    } finally {
      setSending(false)
    }
  }

  const verifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('رمز التحقق يجب أن يكون 6 أرقام')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Get client IP and metadata
      const metadata = {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }

      const response = await fetch(`/api/contracts/${contractId}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          otpCode,
          metadata 
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft)
        }
        throw new Error(result.error || 'رمز التحقق غير صحيح')
      }

      // Success!
      toast.success('🎉 تم التحقق بنجاح!', {
        description: 'يمكنك الآن المتابعة للخطوة التالية'
      })

      // Update contract step
      await supabase
        .from('contracts')
        .update({
          step_5_completed: true,
          step_5_data: {
            verified_at: new Date().toISOString(),
            verification_method: 'otp',
            metadata
          }
        })
        .eq('id', contractId)

      // Move to next step
      await updateContractStep(contractId, 6)

    } catch (error: any) {
      console.error('Error verifying OTP:', error)
      toast.error('فشل التحقق', {
        description: error.message + (attemptsLeft > 0 ? ` - متبقي ${attemptsLeft} محاولات` : '')
      })
    } finally {
      setLoading(false)
    }
  }

  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-900">
            <Check className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold">تم التحقق بنجاح ✅</p>
              <p className="text-sm text-green-700">تم التحقق من هويتك بنجاح</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          التحقق من الهوية عبر OTP
        </CardTitle>
        <CardDescription>
          سيتم إرسال رمز تحقق مكون من 6 أرقام إلى بريدك الإلكتروني
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Alert */}
        <Alert className="bg-purple-50 border-purple-200">
          <AlertCircle className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-900 text-sm">
            <p className="font-semibold mb-1">البريد الإلكتروني المسجل:</p>
            <p className="font-mono">{clientEmail}</p>
          </AlertDescription>
        </Alert>

        {/* Send OTP Button */}
        {!otpSent ? (
          <Button
            onClick={sendOTP}
            disabled={sending}
            size="lg"
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Shield className="ml-2 h-4 w-4" />
                إرسال رمز التحقق
              </>
            )}
          </Button>
        ) : (
          <>
            {/* Timer */}
            <Alert className="bg-blue-50 border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm">صالح لمدة:</span>
                  <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
                </div>
              </AlertDescription>
            </Alert>

            {/* OTP Input */}
            <div className="space-y-2">
              <Label htmlFor="otp-code">أدخل رمز التحقق (6 أرقام)</Label>
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest"
                disabled={loading}
              />
            </div>

            {/* Verify Button */}
            <Button
              onClick={verifyOTP}
              disabled={loading || otpCode.length !== 6}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <Check className="ml-2 h-4 w-4" />
                  تأكيد الرمز
                </>
              )}
            </Button>

            {/* Resend Button */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>لم يصلك الرمز؟</span>
              <Button
                variant="link"
                size="sm"
                onClick={sendOTP}
                disabled={sending || timeLeft > 540} // Can resend after 1 minute
                className="p-0 h-auto"
              >
                <RefreshCw className="ml-1 h-3 w-3" />
                إعادة الإرسال
              </Button>
            </div>

            {/* Attempts Warning */}
            {attemptsLeft < 5 && attemptsLeft > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ متبقي {attemptsLeft} محاولات فقط
                </AlertDescription>
              </Alert>
            )}

            {attemptsLeft === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ❌ تم تجاوز الحد الأقصى للمحاولات. يرجى التواصل مع الدعم.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
