'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, LockKeyhole, ShieldCheck, Unlock } from 'lucide-react'
import { useWorkspaceEncryption } from '@/components/affiliate/use-workspace-encryption'
import { decryptWorkspacePayload } from '@/lib/encryption/client'

interface EncryptedContractViewerProps {
  encryptedPayload: string | null
  encryptionPublicKey: string | null
  contractNumber: string
  serviceType?: string | null
}

interface DecryptedContractPayload {
  payload?: Record<string, any>
  [key: string]: any
}

export function EncryptedContractViewer({
  encryptedPayload,
  encryptionPublicKey,
  contractNumber,
  serviceType,
}: EncryptedContractViewerProps) {
  const {
    loading: keyLoading,
    error: keyError,
    publicKey,
    unlockedPrivateKey,
    isUnlocked,
    unlock,
    lock,
  } = useWorkspaceEncryption()
  const [passphrase, setPassphrase] = useState('')
  const [decrypting, setDecrypting] = useState(false)
  const [decryptError, setDecryptError] = useState<string | null>(null)
  const [decrypted, setDecrypted] = useState<DecryptedContractPayload | null>(null)

  const effectivePublicKey = encryptionPublicKey || publicKey || null
  const encryptedAvailable = Boolean(encryptedPayload && effectivePublicKey)

  const handleUnlock = async () => {
    setDecryptError(null)
    if (!passphrase.trim()) {
      setDecryptError('أدخل كلمة مرور النسخة الاحتياطية أولًا')
      return
    }
    const result = await unlock(passphrase.trim())
    if (!result) {
      setDecryptError('تعذر فك القفل، تأكد من كلمة المرور')
      return
    }
  }

  const handleDecrypt = async () => {
    if (!encryptedPayload) {
      setDecryptError('لا يوجد عقد مشفر محفوظ لهذا السجل')
      return
    }
    if (!effectivePublicKey) {
      setDecryptError('لا يوجد مفتاح عام متاح لهذه العملية')
      return
    }
    if (!unlockedPrivateKey) {
      setDecryptError('يجب فك القفل أولًا باستخدام كلمة المرور')
      return
    }
    try {
      setDecryptError(null)
      setDecrypting(true)
      const result = await decryptWorkspacePayload(encryptedPayload, effectivePublicKey, unlockedPrivateKey)
      setDecrypted(result as DecryptedContractPayload)
    } catch (error) {
      console.error('decryptWorkspacePayload error', error)
      setDecryptError('فشل فك التشفير، تأكد من صحة كلمة المرور أو أن العقد غير متضرر')
    } finally {
      setDecrypting(false)
    }
  }

  const handleLock = () => {
    lock()
    setPassphrase('')
    setDecrypted(null)
    setDecryptError(null)
  }

  const decryptedPayload = (decrypted?.payload as Record<string, any>) || decrypted?.payload === undefined ? decrypted?.payload ?? decrypted : null

  const renderInfoRow = (label: string, value?: string | number | null) => (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-semibold text-sm">{value ?? '—'}</p>
    </div>
  )

  return (
    <Card className="border-emerald-200 bg-emerald-50/40">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <ShieldCheck className="h-5 w-5" />
              عقد مشفر بالكامل
            </CardTitle>
            <CardDescription>يمكن فك تشفير العقد محليًا باستخدام مفتاح workspace الخاص بك فقط.</CardDescription>
          </div>
          <Badge variant={encryptedAvailable ? 'default' : 'secondary'}>
            {encryptedAvailable ? 'E2EE مفعّل' : 'لا يوجد نسخة مشفرة'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>رقم العقد:</span>
            <strong>{contractNumber}</strong>
          </div>
          {serviceType && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>نوع الخدمة:</span>
              <strong>{serviceType}</strong>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            لا يغادر المفتاح الخاص جهازك؛ جميع عمليات فك التشفير تتم داخل المتصفح وتُستخدم مكتبة libsodium.
          </p>
        </div>

        {!encryptedAvailable && (
          <Alert variant="destructive">
            <AlertDescription>لم يتم العثور على نسخة مشفرة لهذا العقد. تأكد من إعادة إنشائه بعد تفعيل التشفير.</AlertDescription>
          </Alert>
        )}

        {keyError && (
          <Alert variant="destructive">
            <AlertDescription>{keyError}</AlertDescription>
          </Alert>
        )}

        {encryptedAvailable && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vault-pass">كلمة المرور</Label>
                <Input
                  id="vault-pass"
                  type="password"
                  disabled={isUnlocked}
                  placeholder="************"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleUnlock} disabled={isUnlocked || keyLoading} className="flex-1">
                  {isUnlocked ? 'تم فك القفل' : 'فك القفل'}
                </Button>
                <Button variant="outline" onClick={handleLock} disabled={!isUnlocked} className="flex items-center gap-1">
                  <LockKeyhole className="h-4 w-4" />
                  قفل
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>الحالة الحالية:</span>
              {isUnlocked ? (
                <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                  <Unlock className="mr-1 h-3 w-3" /> مفتاح مفكوك لهذه الجلسة
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground">
                  <LockKeyhole className="mr-1 h-3 w-3" /> مغلق
                </Badge>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Button onClick={handleDecrypt} disabled={!isUnlocked || decrypting} className="flex items-center gap-2">
                {decrypting && <Loader2 className="h-4 w-4 animate-spin" />}
                فك تشفير العقد
              </Button>
              {decryptError && (
                <Alert variant="destructive">
                  <AlertDescription>{decryptError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {decryptedPayload && (
          <div className="space-y-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-background/80 dark:bg-card/80 p-4">
            <h4 className="font-semibold text-emerald-900">تفاصيل العقد المشفر</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {renderInfoRow('اسم العميل', decryptedPayload.client_name)}
              {renderInfoRow('البريد الإلكتروني', decryptedPayload.client_email)}
              {renderInfoRow('رقم الجوال', decryptedPayload.client_phone)}
              {renderInfoRow('اسم الشركة', decryptedPayload.company_name)}
              {renderInfoRow('نوع الخدمة', decryptedPayload.service_type)}
              {renderInfoRow('الباقة', decryptedPayload.package_name)}
              {renderInfoRow('طريقة الدفع', decryptedPayload.payment_method)}
              {renderInfoRow('المدة الزمنية', decryptedPayload.timeline)}
              {renderInfoRow('المبلغ الإجمالي', decryptedPayload.total_amount)}
              {renderInfoRow('الدفعة المقدمة', decryptedPayload.deposit_amount)}
            </div>
            {decryptedPayload.notes && (
              <div>
                <p className="text-xs uppercase text-muted-foreground">ملاحظات</p>
                <p className="text-sm">{decryptedPayload.notes}</p>
              </div>
            )}
            {Array.isArray(decryptedPayload.deliverables) && decryptedPayload.deliverables.length > 0 && (
              <div>
                <p className="text-xs uppercase text-muted-foreground">تسليمات</p>
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  {decryptedPayload.deliverables.map((item: string, index: number) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(decryptedPayload.contract_terms?.terms) && decryptedPayload.contract_terms?.terms.length > 0 && (
              <div>
                <p className="text-xs uppercase text-muted-foreground">الشروط</p>
                <ul className="list-decimal space-y-1 pl-4 text-sm">
                  {decryptedPayload.contract_terms.terms.map((term: string, index: number) => (
                    <li key={`${term}-${index}`}>{term}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
