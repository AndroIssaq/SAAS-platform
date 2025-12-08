'use client'

/**
 * Subscription Management Page
 * Main page for viewing plans and managing subscription
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, Clock, Zap, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { TrialCountdown } from '@/components/subscription/trial-countdown'
import { PricingCards } from '@/components/subscription/pricing-cards'
import { PaymentMethods, PaymentInstructions } from '@/components/subscription/payment-methods'
import { PaymentForm } from '@/components/subscription/payment-form'
import {
    getSubscriptionStatus,
    getPaymentHistory,
} from '@/lib/actions/subscriptions'
import {
    PLANS,
    type SubscriptionStatusResult,
    type PlanId,
    type PaymentMethod,
} from '@/lib/config/subscription-plans'
import Link from 'next/link'

type Step = 'plans' | 'payment' | 'confirm'

export default function SubscriptionPage() {
    const [status, setStatus] = useState<SubscriptionStatusResult | null>(null)
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState<Step>('plans')
    const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
    const router = useRouter()

    useEffect(() => {
        Promise.all([
            getSubscriptionStatus(),
            getPaymentHistory()
        ]).then(([statusResult, paymentsResult]) => {
            setStatus(statusResult)
            setPayments(paymentsResult)
        }).finally(() => setLoading(false))
    }, [])

    const handleSelectPlan = (planId: PlanId) => {
        if (planId === 'enterprise') {
            // For enterprise, show contact info
            window.open('https://wa.me/201065955670', '_blank')
            return
        }
        setSelectedPlan(planId)
        setStep('payment')
    }

    const handleSelectMethod = (method: PaymentMethod) => {
        setSelectedMethod(method)
    }

    const handleProceedToConfirm = () => {
        if (selectedPlan && selectedMethod) {
            setStep('confirm')
        }
    }

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('payment')
        } else if (step === 'payment') {
            setStep('plans')
            setSelectedPlan(null)
            setSelectedMethod(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="h-4 w-4 ml-2" />
                        العودة للوحة التحكم
                    </Button>
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">إدارة الاشتراك</h1>
                        <p className="text-muted-foreground">اختر الباقة المناسبة لعملك</p>
                    </div>
                </div>
            </div>

            {/* Current Status */}
            <div className="mb-8">
                <TrialCountdown initialStatus={status || undefined} />
            </div>

            {/* Pending Payment Alert */}
            {payments.some(p => p.review_status === 'pending') && (
                <Alert className="mb-8 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                        لديك طلب اشتراك قيد المراجعة. سيتم تفعيل اشتراكك خلال 24 ساعة كحد أقصى.
                    </AlertDescription>
                </Alert>
            )}

            {/* Steps */}
            {step === 'plans' && (
                <div className="space-y-8">
                    {/* Trial Badge */}
                    <div className="text-center">
                        <Badge variant="outline" className="text-lg px-4 py-2">
                            <Zap className="h-4 w-4 ml-2 text-amber-500" />
                            14 يوم تجربة مجانية - بدون بطاقة ائتمان
                        </Badge>
                    </div>

                    {/* Pricing Cards */}
                    <PricingCards onSelectPlan={handleSelectPlan} selectedPlan={selectedPlan || undefined} />

                    {/* Features Comparison (optional) */}
                    <Card className="mt-8">
                        <CardHeader className="text-center">
                            <CardTitle>لماذا تختار منصتنا؟</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-6 text-center">
                                <div className="space-y-2">
                                    <div className="text-3xl">🔒</div>
                                    <h4 className="font-semibold">أمان كامل</h4>
                                    <p className="text-sm text-muted-foreground">بياناتك مشفرة ومحمية بأعلى معايير الأمان</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-3xl">⚡</div>
                                    <h4 className="font-semibold">سرعة وكفاءة</h4>
                                    <p className="text-sm text-muted-foreground">إدارة عقودك وعملائك بضغطة زر</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-3xl">📱</div>
                                    <h4 className="font-semibold">يعمل من أي مكان</h4>
                                    <p className="text-sm text-muted-foreground">متوافق مع جميع الأجهزة</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 'payment' && selectedPlan && (
                <div className="space-y-6">
                    {/* Selected Plan Summary */}
                    <Card className="border-primary/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">الباقة المختارة</p>
                                <p className="font-bold text-lg">
                                    {PLANS.find(p => p.id === selectedPlan)?.nameAr}
                                </p>
                            </div>
                            <div className="text-left">
                                <p className="text-2xl font-bold text-primary">
                                    {PLANS.find(p => p.id === selectedPlan)?.priceLabel}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <PaymentMethods onSelectMethod={handleSelectMethod} selectedMethod={selectedMethod || undefined} />

                    {/* Payment Instructions */}
                    {selectedMethod && (
                        <PaymentInstructions method={selectedMethod} />
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={handleBack}>
                            رجوع
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleProceedToConfirm}
                            disabled={!selectedMethod}
                        >
                            متابعة للدفع
                        </Button>
                    </div>
                </div>
            )}

            {step === 'confirm' && selectedPlan && selectedMethod && (
                <div className="max-w-xl mx-auto">
                    <PaymentForm
                        planId={selectedPlan}
                        paymentMethod={selectedMethod}
                        onBack={handleBack}
                        onSuccess={() => router.refresh()}
                    />
                </div>
            )}

            {/* Payment History */}
            {payments.length > 0 && step === 'plans' && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>سجل المدفوعات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {payments.slice(0, 5).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div>
                                        <p className="font-medium">{payment.amount_egp} جنيه</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(payment.created_at).toLocaleDateString('ar-EG')}
                                        </p>
                                    </div>
                                    <Badge variant={
                                        payment.review_status === 'approved' ? 'default' :
                                            payment.review_status === 'rejected' ? 'destructive' : 'secondary'
                                    }>
                                        {payment.review_status === 'approved' && <CheckCircle2 className="h-3 w-3 ml-1" />}
                                        {payment.review_status === 'rejected' && <AlertTriangle className="h-3 w-3 ml-1" />}
                                        {payment.review_status === 'pending' && <Clock className="h-3 w-3 ml-1" />}
                                        {payment.review_status === 'approved' ? 'مقبول' :
                                            payment.review_status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
