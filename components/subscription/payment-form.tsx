'use client'

/**
 * Payment Form Component
 * For submitting payment proof
 */

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Camera, FileImage, Loader2, CheckCircle2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { submitPaymentForReview } from '@/lib/actions/subscriptions'
import { PLANS, type PlanId, type PaymentMethod } from '@/lib/config/subscription-plans'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PaymentFormProps {
    planId: PlanId
    paymentMethod: PaymentMethod
    onSuccess?: () => void
    onBack?: () => void
}

export function PaymentForm({ planId, paymentMethod, onSuccess, onBack }: PaymentFormProps) {
    const [transactionRef, setTransactionRef] = useState('')
    const [notes, setNotes] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const plan = PLANS.find(p => p.id === planId)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.type.startsWith('image/')) {
            toast.error('يرجى اختيار صورة فقط')
            return
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('حجم الملف يجب أن يكون أقل من 10 ميجا')
            return
        }

        setFile(selectedFile)
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result as string)
        reader.readAsDataURL(selectedFile)
    }

    const handleSubmit = async () => {
        if (!file) {
            toast.error('يرجى رفع صورة إثبات الدفع')
            return
        }

        setUploading(true)

        try {
            const supabase = createClient()

            // Upload proof image
            const fileName = `subscription_${planId}_${Date.now()}.${file.name.split('.').pop()}`
            const { error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(fileName, file, { contentType: file.type, upsert: true })

            if (uploadError) {
                console.error('Upload error:', uploadError)
                throw new Error('فشل في رفع الصورة')
            }

            // Submit payment for review
            const result = await submitPaymentForReview({
                planId,
                paymentMethod,
                transactionReference: transactionRef || undefined,
                proofImagePath: fileName,
                notes: notes || undefined,
            })

            if (!result.success) {
                throw new Error(result.error)
            }

            setSubmitted(true)
            toast.success('تم إرسال طلب الاشتراك بنجاح!')
            onSuccess?.()

        } catch (error: any) {
            console.error('Submit error:', error)
            toast.error(error.message || 'حدث خطأ أثناء إرسال الطلب')
        } finally {
            setUploading(false)
        }
    }

    if (submitted) {
        return (
            <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="py-12 text-center">
                    <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                        تم استلام طلبك بنجاح!
                    </h3>
                    <p className="text-green-600/80 dark:text-green-400/80 mb-6">
                        سيتم مراجعة الدفعة وتفعيل اشتراكك خلال 24 ساعة كحد أقصى
                    </p>
                    <Button onClick={() => router.push('/admin')}>
                        العودة للوحة التحكم
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>تأكيد الدفع</CardTitle>
                <CardDescription>
                    أرسل إثبات الدفع للباقة: {plan?.nameAr} - {plan?.priceLabel}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Transaction Reference */}
                <div className="space-y-2">
                    <Label htmlFor="transaction-ref">رقم المعاملة (اختياري)</Label>
                    <Input
                        id="transaction-ref"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="أدخل رقم المعاملة من الإيصال"
                        disabled={uploading}
                    />
                </div>

                {/* Proof Image Upload */}
                <div className="space-y-4">
                    <Label>صورة إثبات الدفع *</Label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {!preview ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => cameraInputRef.current?.click()}
                                disabled={uploading}
                                className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-green-500/60 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50"
                            >
                                <Camera className="h-8 w-8 text-green-600" />
                                <span className="font-medium text-green-600">📷 التقاط صورة</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-muted-foreground/30 rounded-xl hover:bg-muted/50 transition-all disabled:opacity-50"
                            >
                                <FileImage className="h-8 w-8 text-muted-foreground" />
                                <span className="font-medium">📁 اختيار ملف</span>
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <img
                                src={preview}
                                alt="Payment Proof"
                                className="w-full max-h-64 object-contain rounded-lg border"
                            />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => { setFile(null); setPreview(null) }}
                                disabled={uploading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                    <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="أي ملاحظات إضافية..."
                        rows={2}
                        disabled={uploading}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {onBack && (
                        <Button variant="outline" onClick={onBack} disabled={uploading}>
                            رجوع
                        </Button>
                    )}
                    <Button
                        className="flex-1"
                        onClick={handleSubmit}
                        disabled={!file || uploading}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                جاري الإرسال...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 ml-2" />
                                إرسال طلب الاشتراك
                            </>
                        )}
                    </Button>
                </div>

                <Alert>
                    <AlertDescription className="text-sm text-muted-foreground">
                        سيتم مراجعة طلبك وتفعيل اشتراكك خلال 24 ساعة كحد أقصى. ستتلقى إشعاراً عند التفعيل.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}
