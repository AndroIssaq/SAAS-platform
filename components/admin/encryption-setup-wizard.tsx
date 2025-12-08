/**
 * Encryption Setup Wizard Component
 * Guides admin through setting up Zero-Knowledge encryption
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Key, Download, Copy, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useWorkspaceEncryption } from '@/hooks/use-workspace-encryption'
import { useToast } from '@/hooks/use-toast'

interface EncryptionSetupWizardProps {
    accountId: string
    onComplete?: () => void
}

export function EncryptionSetupWizard({ accountId, onComplete }: EncryptionSetupWizardProps) {
    const [step, setStep] = useState(1)
    const [keyBackedUp, setKeyBackedUp] = useState(false)
    const { setupEncryption, exportKey, privateKey, publicKey } = useWorkspaceEncryption(accountId)
    const { toast } = useToast()

    const handleSetupEncryption = async () => {
        await setupEncryption()
        setStep(2)
    }

    const handleDownloadKey = () => {
        const key = exportKey()
        if (!key) return

        const blob = new Blob([key], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `workspace-${accountId}-encryption-key.txt`
        a.click()
        URL.revokeObjectURL(url)

        toast({
            title: '✅ تم تحميل المفتاح',
            description: 'احفظ هذا الملف في مكان آمن'
        })
    }

    const handleCopyKey = () => {
        const key = exportKey()
        if (!key) return

        navigator.clipboard.writeText(key)
        toast({
            title: '✅ تم النسخ',
            description: 'تم نسخ المفتاح للحافظة'
        })
    }

    const handleConfirmBackup = () => {
        setKeyBackedUp(true)
        setStep(3)
    }

    const handleComplete = () => {
        onComplete?.()
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-4">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${s === step
                                    ? 'bg-primary text-primary-foreground'
                                    : s < step
                                        ? 'bg-green-600 text-white'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
                        </div>
                        {s < 3 && <div className="w-12 h-1 bg-muted" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Introduction */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>تفعيل التشفير من طرف العميل</CardTitle>
                                <CardDescription>Zero-Knowledge Encryption</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="bg-blue-50 border-blue-200">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-900">
                                <strong>ما هو Zero-Knowledge Encryption؟</strong>
                                <p className="mt-2">
                                    نظام تشفير متقدم حيث <strong>حتى نحن</strong> (صاحب المنصة) لا نستطيع الوصول لبياناتك.
                                    البيانات يتم تشفيرها في متصفحك قبل إرسالها للخادم.
                                </p>
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                            <h3 className="font-semibold">ما الذي سيتم تشفيره؟</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span>بيانات العملاء (الأسماء، الإيميلات، الهواتف)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span>المبالغ المالية والتفاصيل المالية</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span>الصور (التوقيعات، بطاقات الهوية)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span>تفاصيل الخدمات والباقات</span>
                                </li>
                            </ul>
                        </div>

                        <Alert className="bg-yellow-50 border-yellow-200">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-900">
                                <strong>تحذير مهم:</strong>
                                <ul className="mt-2 space-y-1 list-disc list-inside">
                                    <li>سيتم إنشاء مفتاح تشفير خاص بك</li>
                                    <li>يجب عليك حفظ نسخة احتياطية من المفتاح</li>
                                    <li><strong>إذا فقدت المفتاح، لن تستطيع استرجاع البيانات للأبد</strong></li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        <Button onClick={handleSetupEncryption} size="lg" className="w-full">
                            <Shield className="mr-2 h-5 w-5" />
                            ابدأ إعداد التشفير
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Backup Key */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Key className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>احفظ المفتاح الخاص</CardTitle>
                                <CardDescription>هذا المفتاح ضروري لاسترجاع بياناتك</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="bg-red-50 border-red-200">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-900">
                                <strong>حرج جداً!</strong> احفظ هذا المفتاح في مكان آمن. لن يتم عرضه مرة أخرى!
                            </AlertDescription>
                        </Alert>

                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">المفتاح الخاص:</p>
                            <code className="text-xs break-all block bg-background p-3 rounded border">
                                {privateKey || 'جاري التحميل...'}
                            </code>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button onClick={handleDownloadKey} variant="outline" className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                تحميل كملف
                            </Button>
                            <Button onClick={handleCopyKey} variant="outline" className="w-full">
                                <Copy className="mr-2 h-4 w-4" />
                                نسخ
                            </Button>
                        </div>

                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertDescription className="text-blue-900">
                                <strong>طرق آمنة لحفظ المفتاح:</strong>
                                <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                                    <li>احفظه في مدير كلمات السر (1Password, Bitwarden)</li>
                                    <li>احفظه في ملف مشفر على جهازك</li>
                                    <li>اطبعه واحفظه في خزنة</li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={keyBackedUp}
                                    onChange={(e) => setKeyBackedUp(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">
                                    أؤكد أنني حفظت نسخة احتياطية آمنة من المفتاح الخاص
                                </span>
                            </label>

                            <Button
                                onClick={handleConfirmBackup}
                                disabled={!keyBackedUp}
                                size="lg"
                                className="w-full"
                            >
                                متابعة
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Complete */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                            <div>
                                <CardTitle>تم تفعيل التشفير بنجاح! 🎉</CardTitle>
                                <CardDescription>بياناتك الآن محمية بالكامل</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-900">
                                <strong>التشفير مفعّل!</strong>
                                <p className="mt-2">
                                    جميع البيانات الجديدة سيتم تشفيرها تلقائياً قبل حفظها في قاعدة البيانات.
                                </p>
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                            <h3 className="font-semibold">الخطوات التالية:</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">1.</span>
                                    <span>العقود الجديدة سيتم تشفيرها تلقائياً</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">2.</span>
                                    <span>يمكنك تشفير العقود القديمة من إعدادات الأمان</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">3.</span>
                                    <span>احتفظ بالمفتاح الخاص في مكان آمن دائماً</span>
                                </li>
                            </ul>
                        </div>

                        <Button onClick={handleComplete} size="lg" className="w-full">
                            إنهاء
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
