/**
 * Workspace Encryption Settings Page
 * Allows admin to set up and manage Zero-Knowledge encryption
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock, Key, AlertTriangle } from 'lucide-react'
import { EncryptionSetupWizard } from '@/components/admin/encryption-setup-wizard'

export default async function EncryptionSettingsPage() {
    const supabase = await createClient()

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Get current account
    const { data: member } = await supabase
        .from('account_members')
        .select('account_id, role')
        .eq('user_id', user.id)
        .single()

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        redirect('/admin/dashboard')
    }

    const accountId = member.account_id

    // Check if encryption is already set up
    const { data: existingKey } = await supabase
        .from('workspace_keys')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle()

    const isEncryptionSetup = !!existingKey

    return (
        <div className="container max-w-6xl py-10 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    إعدادات التشفير
                </h1>
                <p className="text-muted-foreground mt-2">
                    قم بإعداد وإدارة التشفير من طرف العميل (Zero-Knowledge Encryption)
                </p>
            </div>

            {!isEncryptionSetup ? (
                <>
                    {/* Introduction Card */}
                    <Card className="border-2 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                لماذا Zero-Knowledge Encryption؟
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-green-600">المزايا:</h3>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            <span>حتى صاحب المنصة لا يستطيع الوصول لبياناتك</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            <span>أقصى مستوى من الأمان والخصوصية</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            <span>يلبي أعلى معايير GDPR و SOC2</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600">✓</span>
                                            <span>ثقة كاملة للعملاء والشركاء</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-yellow-600">المسؤوليات:</h3>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                            <span>يجب حفظ نسخة احتياطية من المفتاح الخاص</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                            <span>فقدان المفتاح = فقدان البيانات للأبد</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                            <span>لا يمكن استرجاع البيانات بدون المفتاح</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Setup Wizard */}
                    <EncryptionSetupWizard accountId={accountId} />
                </>
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-green-600" />
                            <div>
                                <CardTitle>التشفير مفعّل ✓</CardTitle>
                                <CardDescription>بياناتك محمية بالكامل</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="bg-green-50 border-green-200">
                            <Shield className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-900">
                                <strong>التشفير نشط!</strong>
                                <p className="mt-2">
                                    جميع البيانات الحساسة يتم تشفيرها تلقائياً قبل حفظها في قاعدة البيانات.
                                </p>
                            </AlertDescription>
                        </Alert>

                        <div className="grid md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">معلومات المفتاح العام</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">Public Key:</p>
                                        <code className="text-xs break-all block bg-muted p-2 rounded">
                                            {existingKey.public_key.slice(0, 40)}...
                                        </code>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            <strong>النوع:</strong> {existingKey.key_type}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            <strong>الإصدار:</strong> {existingKey.encryption_version}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">إدارة المفتاح الخاص</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Alert className="bg-yellow-50 border-yellow-200">
                                        <Key className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-yellow-900 text-sm">
                                            المفتاح الخاص محفوظ في متصفحك فقط. احرص على حفظ نسخة احتياطية!
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
