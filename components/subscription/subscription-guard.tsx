'use client'

/**
 * Subscription Guard Component
 * Wraps protected pages and blocks access for expired trials
 */

import { useEffect, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Zap, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { getSubscriptionStatus } from '@/lib/actions/subscriptions'
import { type SubscriptionStatusResult } from '@/lib/config/subscription-plans'

interface SubscriptionGuardProps {
    children: ReactNode
    fallback?: ReactNode
}

export function SubscriptionGuard({ children, fallback }: SubscriptionGuardProps) {
    const pathname = usePathname()
    const [status, setStatus] = useState<SubscriptionStatusResult | null>(null)
    const [loading, setLoading] = useState(true)

    // Helper: Allow access if on subscription page, regardless of status
    const isSubscriptionPage = pathname?.includes('/admin/subscription')

    useEffect(() => {
        getSubscriptionStatus()
            .then(setStatus)
            .finally(() => setLoading(false))
    }, [])

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">جاري التحقق من حالة الاشتراك...</p>
                </div>
            </div>
        )
    }

    // Access granted (trial active OR subscribed OR viewing subscription page)
    if (isSubscriptionPage || (status && !status.isBlocked)) {
        return <>{children}</>
    }

    // Custom fallback
    if (fallback) {
        return <>{fallback}</>
    }

    // Blocked view with transparent overlay - shows content behind
    return (
        <div className="relative">
            {/* Show the actual content behind - blurred and non-interactive */}
            <div className="pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.4 }}>
                {children}
            </div>

            {/* Semi-transparent overlay with blocking UI */}
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <Card className="max-w-lg w-full border-2 border-red-200 dark:border-red-900 shadow-2xl bg-background">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-10 w-10 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl text-red-700 dark:text-red-400">
                            انتهت الفترة التجريبية
                        </CardTitle>
                        <CardDescription className="text-base">
                            نأسف، لقد انتهت فترة التجربة المجانية لمدة 14 يوم
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-800 dark:text-amber-200">
                                    <p className="font-medium mb-1">لماذا تم حظر الوصول؟</p>
                                    <p>تنتهي الفترة التجريبية المجانية بعد 14 يوم من إنشاء الحساب. للاستمرار في استخدام جميع مميزات المنصة، يرجى الاشتراك في إحدى الباقات المتاحة.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-center">ما الذي ستحصل عليه بالاشتراك؟</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    إدارة عقود وعملاء غير محدودة
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    نماذج Lead Gen وإرسال بريد إلكتروني
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    نظام الشركاء والعمولات
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    تقارير وإحصائيات متقدمة
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link href="/admin/subscription" className="w-full">
                                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg py-6">
                                    <Zap className="h-5 w-5 ml-2" />
                                    اشترك الآن وابدأ فوراً
                                </Button>
                            </Link>

                            <p className="text-center text-sm text-muted-foreground">
                                الأسعار تبدأ من <strong>299 جنيه/شهر</strong> فقط
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

