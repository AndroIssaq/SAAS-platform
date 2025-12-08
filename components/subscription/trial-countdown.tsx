'use client'

/**
 * Trial Countdown Widget
 * Shows remaining trial days on dashboard
 */

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, Zap, Crown, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { getSubscriptionStatus } from '@/lib/actions/subscriptions'
import { type SubscriptionStatusResult } from '@/lib/config/subscription-plans'

interface TrialCountdownProps {
    initialStatus?: SubscriptionStatusResult
}

export function TrialCountdown({ initialStatus }: TrialCountdownProps) {
    const [status, setStatus] = useState<SubscriptionStatusResult | null>(initialStatus || null)
    const [loading, setLoading] = useState(!initialStatus)

    useEffect(() => {
        if (!initialStatus) {
            getSubscriptionStatus().then(setStatus).finally(() => setLoading(false))
        }
    }, [initialStatus])

    if (loading) {
        return (
            <Card className="border-2 border-dashed border-muted-foreground/20 animate-pulse">
                <CardContent className="p-6">
                    <div className="h-24 bg-muted rounded" />
                </CardContent>
            </Card>
        )
    }

    if (!status) return null

    // Active subscription - show success state
    if (status.status === 'active' && status.currentPlan) {
        return (
            <Card className="border-2 border-green-500/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-500/20 rounded-full">
                                <Crown className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-green-700 dark:text-green-400">
                                    {status.currentPlan.nameAr}
                                </h3>
                                <p className="text-sm text-green-600/80 dark:text-green-400/80">
                                    اشتراك فعال حتى {status.subscriptionEndsAt?.toLocaleDateString('ar-EG')}
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-green-600">فعال</Badge>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Trial expired - show urgent upgrade message
    if (status.status === 'expired' || status.trialDaysRemaining <= 0) {
        return (
            <Card className="border-2 border-red-500 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-500/20 rounded-full animate-pulse">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-red-700 dark:text-red-400">
                                    انتهت الفترة التجريبية
                                </h3>
                                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                                    اشترك الآن لمتابعة استخدام المنصة
                                </p>
                            </div>
                        </div>
                        <Link href="/admin/subscription">
                            <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg">
                                <Zap className="h-4 w-4 ml-2" />
                                اشترك الآن
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Trial active - show countdown
    const totalDays = 14
    const progress = ((totalDays - status.trialDaysRemaining) / totalDays) * 100
    const isLowDays = status.trialDaysRemaining <= 3

    return (
        <Card className={`border-2 ${isLowDays ? 'border-amber-500/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20' : 'border-primary/30 bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-950/20'}`}>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isLowDays ? 'bg-amber-500/20' : 'bg-primary/20'}`}>
                            <Clock className={`h-6 w-6 ${isLowDays ? 'text-amber-600' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-bold text-lg ${isLowDays ? 'text-amber-700 dark:text-amber-400' : 'text-primary'}`}>
                                    فترة تجريبية مجانية
                                </h3>
                                <Badge variant="outline" className={isLowDays ? 'border-amber-500 text-amber-600' : ''}>
                                    {status.trialDaysRemaining} يوم متبقي
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <Progress
                                    value={progress}
                                    className={`h-2 ${isLowDays ? '[&>div]:bg-amber-500' : ''}`}
                                />
                                <p className={`text-sm ${isLowDays ? 'text-amber-600/80' : 'text-muted-foreground'}`}>
                                    {isLowDays
                                        ? '⚠️ أوشكت الفترة التجريبية على الانتهاء!'
                                        : 'استمتع بجميع المميزات مجاناً'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link href="/admin/subscription">
                        <Button
                            variant={isLowDays ? 'default' : 'outline'}
                            className={isLowDays
                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white'
                                : 'border-primary/50 hover:bg-primary/10'}
                        >
                            <Zap className="h-4 w-4 ml-2" />
                            {isLowDays ? 'اشترك الآن' : 'عرض الباقات'}
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
