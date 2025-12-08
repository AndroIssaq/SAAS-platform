'use client'

/**
 * Payment Methods Component
 * Shows available payment options
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Copy, Phone } from 'lucide-react'
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/config/subscription-plans'
import { toast } from 'sonner'

interface PaymentMethodsProps {
    onSelectMethod?: (method: PaymentMethod) => void
    selectedMethod?: PaymentMethod
}

export function PaymentMethods({ onSelectMethod, selectedMethod }: PaymentMethodsProps) {
    const [copiedNumber, setCopiedNumber] = useState(false)

    const copyNumber = async () => {
        await navigator.clipboard.writeText('01065955670')
        setCopiedNumber(true)
        toast.success('تم نسخ الرقم!')
        setTimeout(() => setCopiedNumber(false), 2000)
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">اختر طريقة الدفع</h3>

            {/* Phone Number Banner */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-full">
                                <Phone className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-green-700 dark:text-green-400">رقم الدفع الموحد</p>
                                <p className="text-2xl font-bold text-green-800 dark:text-green-300 tracking-wider" dir="ltr">
                                    01065955670
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={copyNumber}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                            {copiedNumber ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    تم النسخ
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" />
                                    نسخ الرقم
                                </>
                            )}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Methods Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethod === method.id

                    return (
                        <Card
                            key={method.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${isSelected
                                ? 'border-2 border-primary ring-2 ring-primary/20'
                                : 'hover:border-primary/50'
                                }`}
                            onClick={() => onSelectMethod?.(method.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{method.icon}</span>
                                        <span className="font-semibold">{method.name}</span>
                                    </div>
                                    {isSelected && (
                                        <Badge className="bg-primary">
                                            <Check className="h-3 w-3 ml-1" />
                                            مختار
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {method.details}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * Payment Instructions Component
 * Shows instructions for selected payment method
 */
interface PaymentInstructionsProps {
    method: PaymentMethod
}

export function PaymentInstructions({ method }: PaymentInstructionsProps) {
    const methodInfo = PAYMENT_METHODS.find(m => m.id === method)

    if (!methodInfo) return null

    const instructions = methodInfo.instructions.split('\n')

    return (
        <Card className="bg-muted/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">{methodInfo.icon}</span>
                    خطوات الدفع عبر {methodInfo.name}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ol className="space-y-2">
                    {instructions.map((step, index) => (
                        <li key={index} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                            </span>
                            <span>{step.replace(/^\d+\.\s*/, '')}</span>
                        </li>
                    ))}
                </ol>
            </CardContent>
        </Card>
    )
}
