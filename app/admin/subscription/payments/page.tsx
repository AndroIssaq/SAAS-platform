'use client'

/**
 * Admin Subscription Payments Review Page
 * For approving/rejecting subscription payments
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    Eye,
    ArrowLeft,
    CreditCard,
    Building2,
    RefreshCw
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    getPendingPayments,
    approvePayment,
    rejectPayment,
} from '@/lib/actions/subscriptions'
import { PAYMENT_METHODS } from '@/lib/config/subscription-plans'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SubscriptionPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null)

    const loadPayments = async () => {
        setLoading(true)
        const data = await getPendingPayments()
        setPayments(data)
        setLoading(false)
    }

    useEffect(() => {
        loadPayments()
    }, [])

    const handleApprove = async (paymentId: string) => {
        setProcessing(paymentId)
        const result = await approvePayment(paymentId)

        if (result.success) {
            toast.success('تم تفعيل الاشتراك بنجاح!')
            loadPayments()
        } else {
            toast.error(result.error || 'حدث خطأ')
        }
        setProcessing(null)
    }

    const handleReject = async () => {
        if (!selectedPayment || !rejectReason.trim()) {
            toast.error('يرجى كتابة سبب الرفض')
            return
        }

        setProcessing(selectedPayment.id)
        const result = await rejectPayment(selectedPayment.id, rejectReason)

        if (result.success) {
            toast.success('تم رفض الدفعة')
            setShowRejectDialog(false)
            setRejectReason('')
            setSelectedPayment(null)
            loadPayments()
        } else {
            toast.error(result.error || 'حدث خطأ')
        }
        setProcessing(null)
    }

    const viewProof = async (payment: any) => {
        setSelectedPayment(payment)

        if (payment.proof_image_path) {
            const supabase = createClient()
            const { data } = await supabase.storage
                .from('payment-proofs')
                .createSignedUrl(payment.proof_image_path, 3600)

            if (data?.signedUrl) {
                setSignedImageUrl(data.signedUrl)
            }
        }
    }

    const getMethodName = (methodId: string) => {
        return PAYMENT_METHODS.find(m => m.id === methodId)?.name || methodId
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="h-4 w-4 ml-2" />
                        العودة للوحة التحكم
                    </Button>
                </Link>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">مراجعة المدفوعات</h1>
                            <p className="text-muted-foreground">طلبات اشتراك تنتظر الموافقة</p>
                        </div>
                    </div>

                    <Button variant="outline" onClick={loadPayments}>
                        <RefreshCw className="h-4 w-4 ml-2" />
                        تحديث
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                        <p className="text-2xl font-bold">{payments.length}</p>
                        <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold">-</p>
                        <p className="text-sm text-muted-foreground">مقبولة اليوم</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                        <p className="text-2xl font-bold">-</p>
                        <p className="text-sm text-muted-foreground">مرفوضة اليوم</p>
                    </CardContent>
                </Card>
            </div>

            {/* Payments List */}
            {payments.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500/50" />
                        <h3 className="text-xl font-semibold mb-2">لا توجد طلبات معلقة</h3>
                        <p className="text-muted-foreground">جميع طلبات الاشتراك تمت مراجعتها</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {payments.map((payment) => (
                        <Card key={payment.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Payment Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-semibold">{payment.account?.name || 'حساب غير معروف'}</span>
                                            <Badge variant="outline">
                                                {payment.subscription?.plan_name}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">المبلغ</p>
                                                <p className="font-bold text-lg">{payment.amount_egp} جنيه</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">طريقة الدفع</p>
                                                <p className="font-medium">{getMethodName(payment.payment_method)}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">رقم المعاملة</p>
                                                <p className="font-medium">{payment.transaction_reference || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">التاريخ</p>
                                                <p className="font-medium">{new Date(payment.created_at).toLocaleDateString('ar-EG')}</p>
                                            </div>
                                        </div>

                                        {payment.notes && (
                                            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                                ملاحظات: {payment.notes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => viewProof(payment)}
                                        >
                                            <Eye className="h-4 w-4 ml-2" />
                                            عرض الإثبات
                                        </Button>

                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApprove(payment.id)}
                                            disabled={processing === payment.id}
                                        >
                                            {processing === payment.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 ml-2" />
                                                    موافقة
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedPayment(payment)
                                                setShowRejectDialog(true)
                                            }}
                                            disabled={processing === payment.id}
                                        >
                                            <XCircle className="h-4 w-4 ml-2" />
                                            رفض
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Proof Image Dialog */}
            <Dialog open={!!selectedPayment && !showRejectDialog} onOpenChange={() => setSelectedPayment(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>إثبات الدفع</DialogTitle>
                        <DialogDescription>
                            {selectedPayment?.account?.name} - {selectedPayment?.amount_egp} جنيه
                        </DialogDescription>
                    </DialogHeader>

                    {signedImageUrl ? (
                        <img
                            src={signedImageUrl}
                            alt="Payment Proof"
                            className="w-full max-h-[60vh] object-contain rounded-lg border"
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                            <p className="text-muted-foreground">لا توجد صورة</p>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => selectedPayment && handleApprove(selectedPayment.id)}
                            disabled={processing === selectedPayment?.id}
                        >
                            {processing === selectedPayment?.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 ml-2" />
                                    موافقة وتفعيل الاشتراك
                                </>
                            )}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowRejectDialog(true)}
                        >
                            <XCircle className="h-4 w-4 ml-2" />
                            رفض
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>رفض الدفعة</DialogTitle>
                        <DialogDescription>
                            يرجى كتابة سبب الرفض ليتم إبلاغ العميل
                        </DialogDescription>
                    </DialogHeader>

                    <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="سبب الرفض..."
                        rows={3}
                    />

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            إلغاء
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || processing === selectedPayment?.id}
                        >
                            {processing === selectedPayment?.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'تأكيد الرفض'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
