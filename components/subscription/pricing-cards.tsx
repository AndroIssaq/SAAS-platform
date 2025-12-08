'use client'

/**
 * Pricing Cards Component
 * Displays subscription plans with features
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Building2, Crown, MessageCircle } from 'lucide-react'
import { PLANS, type Plan, type PlanId } from '@/lib/config/subscription-plans'

interface PricingCardsProps {
    onSelectPlan?: (planId: PlanId) => void
    selectedPlan?: PlanId
}

const planIcons = {
    small_office: Building2,
    large_company: Zap,
    enterprise: Crown,
}

const planColors = {
    small_office: 'from-blue-500 to-cyan-500',
    large_company: 'from-purple-500 to-pink-500',
    enterprise: 'from-amber-500 to-orange-500',
}

export function PricingCards({ onSelectPlan, selectedPlan }: PricingCardsProps) {
    const [hoveredPlan, setHoveredPlan] = useState<PlanId | null>(null)

    return (
        <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
                const Icon = planIcons[plan.id]
                const isSelected = selectedPlan === plan.id
                const isHovered = hoveredPlan === plan.id
                const isEnterprise = plan.id === 'enterprise'

                return (
                    <Card
                        key={plan.id}
                        className={`relative transition-all duration-300 cursor-pointer ${isSelected
                            ? 'border-2 border-primary ring-2 ring-primary/20 scale-[1.02]'
                            : plan.popular
                                ? 'border-2 border-purple-500/50'
                                : 'border border-muted hover:border-primary/50'
                            } ${isHovered ? 'shadow-xl -translate-y-1' : ''}`}
                        onMouseEnter={() => setHoveredPlan(plan.id)}
                        onMouseLeave={() => setHoveredPlan(null)}
                        onClick={() => onSelectPlan?.(plan.id)}
                    >
                        {/* Popular Badge */}
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                                    ⭐ الأكثر طلباً
                                </Badge>
                            </div>
                        )}

                        <CardHeader className="text-center pb-2">
                            {/* Icon */}
                            <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${planColors[plan.id]} flex items-center justify-center mb-4 shadow-lg`}>
                                <Icon className="h-8 w-8 text-white" />
                            </div>

                            <CardTitle className="text-xl">{plan.nameAr}</CardTitle>
                            <CardDescription>{plan.name}</CardDescription>

                            {/* Price */}
                            <div className="mt-4">
                                {isEnterprise ? (
                                    <div className="text-2xl font-bold text-amber-600">
                                        تواصل معنا
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-4xl font-bold">{plan.priceEgp}</span>
                                        <span className="text-muted-foreground mr-1">جنيه/شهر</span>
                                    </>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Features */}
                            <ul className="space-y-3">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <Button
                                className={`w-full mt-4 ${isEnterprise
                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                                    : plan.popular
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                        : ''
                                    }`}
                                variant={isSelected ? 'default' : plan.popular || isEnterprise ? 'default' : 'outline'}
                            >
                                {isEnterprise ? (
                                    <>
                                        <MessageCircle className="h-4 w-4 ml-2" />
                                        تواصل معنا
                                    </>
                                ) : isSelected ? (
                                    <>
                                        <Check className="h-4 w-4 ml-2" />
                                        تم الاختيار
                                    </>
                                ) : (
                                    <>
                                        <Zap className="h-4 w-4 ml-2" />
                                        اختر هذه الباقة
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
