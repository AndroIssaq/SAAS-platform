"use client"

/**
 * OTP Verification Step - Step 3
 * Client verifies email/phone via OTP code
 */

import { useState, useEffect } from "react"
import { useContractFlowStore } from "@/lib/stores/contract-flow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle2,
  Mail,
  AlertCircle,
  Loader2,
  Clock,
  RefreshCw,
} from "lucide-react"
import type { ParticipantRole } from "@/lib/contract-flow/flow-state-machine"

interface OTPVerificationStepProps {
  contractId: string
  participant: ParticipantRole
  contractData: any
  stepState: any
}

export function OTPVerificationStep({
  contractId,
  participant,
  contractData,
  stepState,
}: OTPVerificationStepProps) {
  const [otpCode, setOtpCode] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { performAction, canPerformAction } = useContractFlowStore()

  const isVerified = stepState.clientCompleted
  const validation = canPerformAction('OTP_VERIFIED' as any)
  const clientValidation = canPerformAction('OTP_VERIFIED' as any, 'client')

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Handle send OTP
  const handleSendOTP = async () => {
    setIsSending(true)
    setError(null)

    try {
      const response = await fetch(`/api/contracts/${contractId}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إرسال رمز التحقق')
      }

      setOtpSent(true)
      setCountdown(600) // 10 minutes
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSending(false)
    }
  }

  // Handle verify OTP
  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError('يرجى إدخال رمز مكون من 6 أرقام')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch(`/api/contracts/${contractId}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'رمز التحقق غير صحيح')
      }

      // Perform action in store
      const result = await performAction('OTP_VERIFIED' as any, {
        verifiedAt: new Date().toISOString(),
        email: contractData.client_email,
      })

      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsVerifying(false)
    }
  }

  // Format countdown
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Admin view: perform on behalf of client
  if (participant === 'admin') {
    return (
      <div className="space-y-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              التحقق من هوية العميل
              {isVerified && (
                <Badge className="bg-green-600 mr-auto">
                  <CheckCircle2 className="h-3 w-3 ml-1" />
                  تم التحقق
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              سيتم إرسال رمز تحقق إلى بريد العميل: <strong>{contractData.client_email}</strong>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Send OTP Card */}
        {!otpSent && !isVerified && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>الخطوة 1: إرسال رمز التحقق للعميل</CardTitle>
            </CardHeader>
            <CardContent>
              {clientValidation.allowed ? (
                <Button size="lg" className="w-full" onClick={handleSendOTP} disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 ml-2" />
                      إرسال رمز التحقق للعميل
                    </>
                  )}
                </Button>
              ) : (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">{clientValidation.reason}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Verify OTP Card */}
        {otpSent && !isVerified && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>الخطوة 2: أدخل رمز التحقق للعميل</CardTitle>
                  <CardDescription className="mt-1">تحقق من بريد العميل وأدخل الرمز</CardDescription>
                </div>
                {countdown > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(countdown)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtpCode(value)
                    setError(null)
                  }}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleSendOTP} disabled={isSending || countdown > 540}>
                  <RefreshCw className="h-4 w-4 ml-2" />
                  إعادة الإرسال
                </Button>
                <Button
                  className="flex-1"
                  onClick={async () => {
                    if (otpCode.length !== 6) {
                      setError('يرجى إدخال رمز مكون من 6 أرقام')
                      return
                    }

                    setIsVerifying(true)
                    setError(null)

                    try {
                      const response = await fetch(`/api/contracts/${contractId}/otp/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ otpCode }),
                      })

                      const data = await response.json()
                      if (!response.ok) throw new Error(data.error || 'رمز التحقق غير صحيح')

                      const result = await performAction('OTP_VERIFIED' as any, {
                        verifiedAt: new Date().toISOString(),
                        email: contractData.client_email,
                        onBehalfOf: 'client',
                      })
                      if (!result.success) throw new Error(result.error)
                    } catch (err: any) {
                      setError(err.message)
                    } finally {
                      setIsVerifying(false)
                    }
                  }}
                  disabled={isVerifying || otpCode.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 ml-2" />
                      تحقق نيابةً عن العميل
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isVerified && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">✅ تم التحقق من هوية العميل بنجاح</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Client view - Already verified
  if (isVerified) {
    return (
      <Card className="border-2 border-green-500 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle2 className="h-6 w-6" />
            تم التحقق بنجاح!
          </CardTitle>
          <CardDescription className="text-green-700">
            تم التحقق من هويتك عبر OTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-background dark:bg-card rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-900">
              ✅ تم التحقق من بريدك الإلكتروني: <strong>{contractData.client_email}</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Client view - Not verified
  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            التحقق من هويتك
          </CardTitle>
          <CardDescription>
            سنرسل رمز تحقق مكون من 6 أرقام إلى بريدك الإلكتروني
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
            <p className="font-semibold">{contractData.client_email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Send OTP Card */}
      {!otpSent && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>الخطوة 1: إرسال رمز التحقق</CardTitle>
          </CardHeader>
          <CardContent>
            {validation.allowed ? (
              <Button
                size="lg"
                className="w-full"
                onClick={handleSendOTP}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 ml-2" />
                    إرسال رمز التحقق
                  </>
                )}
              </Button>
            ) : (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  {validation.reason}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verify OTP Card */}
      {otpSent && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>الخطوة 2: أدخل رمز التحقق</CardTitle>
                <CardDescription className="mt-1">
                  تحقق من بريدك الإلكتروني وأدخل الرمز المكون من 6 أرقام
                </CardDescription>
              </div>
              {countdown > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(countdown)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtpCode(value)
                  setError(null)
                }}
                className="text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSendOTP}
                disabled={isSending || countdown > 540}
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة الإرسال
              </Button>
              <Button
                className="flex-1"
                onClick={handleVerifyOTP}
                disabled={isVerifying || otpCode.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 ml-2" />
                    تحقق
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>💡 <strong>نصائح:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تحقق من مجلد البريد المزعج (Spam)</li>
              <li>الرمز صالح لمدة 10 دقائق</li>
              <li>يمكنك إعادة الإرسال بعد دقيقة واحدة</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
