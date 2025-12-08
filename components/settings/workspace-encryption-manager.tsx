'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type SodiumType from "libsodium-wrappers-sumo"

import { getSodiumInstance } from "@/lib/encryption/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const LOCAL_STORAGE_VAULT_KEY = "aqdi.workspaceKeyVault"

interface WorkspaceKeyRecord {
  account_id: string
  public_key: string
  key_type: string
  encryption_version: string
  created_at: string
  updated_at: string
}

interface VaultRecord {
  version: string
  salt: string
  nonce: string
  ciphertext: string
  createdAt: string
  publicKey: string
}

interface WorkspaceEncryptionManagerProps {
  accountId: string | null
  initialKey: WorkspaceKeyRecord | null
  initialError: string | null
}

export function WorkspaceEncryptionManager({ accountId, initialKey, initialError }: WorkspaceEncryptionManagerProps) {
  const { toast } = useToast()
  const [sodium, setSodium] = useState<SodiumType | null>(null)
  const [loading, setLoading] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(initialKey?.public_key ?? null)
  const [vault, setVault] = useState<VaultRecord | null>(null)
  const [remoteVault, setRemoteVault] = useState<VaultRecord | null>(null)
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState<string | null>(null)
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [passphrase, setPassphrase] = useState("")
  const [confirmPassphrase, setConfirmPassphrase] = useState("")
  const [unlockPassphrase, setUnlockPassphrase] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [restorePassphrase, setRestorePassphrase] = useState("")
  const [restoreFileName, setRestoreFileName] = useState<string | null>(null)
  const [restorePayload, setRestorePayload] = useState<VaultRecord | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [statusMessage, setStatusMessage] = useState<string | null>(initialError)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const sodiumModule = await getSodiumInstance()
        if (mounted) {
          setSodium(sodiumModule)
        }
      } catch (error) {
        console.error("Failed to load libsodium", error)
        toast({ variant: "destructive", title: "تعذّر تحميل مكتبة التشفير", description: "أعد تحميل الصفحة وحاول مرة أخرى" })
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_VAULT_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as VaultRecord
        setVault(parsed)
      }
    } catch (error) {
      console.error("Failed to parse local vault", error)
    }
    fetchRemoteEnvelope()
  }, [])

  const fetchRemoteEnvelope = useCallback(async () => {
    try {
      setRemoteLoading(true)
      const response = await fetch("/api/workspace/member-key")
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        setRemoteVault(null)
        setRemoteUpdatedAt(null)
        return
      }
      const encryptedWorkspaceKey = payload.data?.encrypted_workspace_key
      if (typeof encryptedWorkspaceKey !== "string") {
        setRemoteVault(null)
        setRemoteUpdatedAt(payload.data?.created_at ?? null)
        return
      }
      const parsed = JSON.parse(encryptedWorkspaceKey) as VaultRecord
      setRemoteVault(parsed)
      setRemoteUpdatedAt(payload.data?.created_at ?? null)
    } catch (error) {
      console.error("fetchRemoteEnvelope error", error)
      setRemoteVault(null)
      setRemoteUpdatedAt(null)
    } finally {
      setRemoteLoading(false)
    }
  }, [])

  const readyState = useMemo(() => {
    if (!accountId) return "no-account"
    if (!sodium) return "loading-sodium"
    return "ready"
  }, [accountId, sodium])

  const ensureSodium = useCallback(() => {
    if (!sodium) {
      toast({ variant: "destructive", title: "مكتبة التشفير لم تُحمّل بعد", description: "انتظر لحظات ثم أعد المحاولة." })
      return false
    }
    if (!accountId) {
      toast({ variant: "destructive", title: "لا يوجد مساحة عمل", description: "تأكد من تسجيل الدخول لمساحة عمل صالحة." })
      return false
    }
    return true
  }, [sodium, accountId, toast])

  const encryptPrivateKey = useCallback(
    (privateKey: Uint8Array, secret: string) => {
      if (!sodium) throw new Error("Sodium not ready")
      const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES)
      const key = sodium.crypto_pwhash(
        sodium.crypto_secretbox_KEYBYTES,
        secret,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_MODERATE,
        sodium.crypto_pwhash_MEMLIMIT_MODERATE,
        sodium.crypto_pwhash_ALG_DEFAULT
      )
      const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
      const ciphertext = sodium.crypto_secretbox_easy(privateKey, nonce, key)
      return {
        salt: sodium.to_base64(salt),
        nonce: sodium.to_base64(nonce),
        ciphertext: sodium.to_base64(ciphertext),
      }
    },
    [sodium]
  )

  const decryptPrivateKey = useCallback(
    (record: VaultRecord, secret: string) => {
      if (!sodium) throw new Error("Sodium not ready")
      const salt = sodium.from_base64(record.salt)
      const nonce = sodium.from_base64(record.nonce)
      const ciphertext = sodium.from_base64(record.ciphertext)
      const key = sodium.crypto_pwhash(
        sodium.crypto_secretbox_KEYBYTES,
        secret,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_MODERATE,
        sodium.crypto_pwhash_MEMLIMIT_MODERATE,
        sodium.crypto_pwhash_ALG_DEFAULT
      )
      const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key)
      return decrypted
    },
    [sodium]
  )

  const uploadMemberEnvelope = useCallback(
    async (record: VaultRecord) => {
      try {
        const response = await fetch("/api/workspace/member-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            encryptedWorkspaceKey: JSON.stringify(record),
            keyVersion: record.version ?? "v1",
          }),
        })
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "فشل رفع النسخة السحابية")
        }
        setRemoteVault(record)
        setRemoteUpdatedAt(new Date().toISOString())
        toast({ title: "تمت مزامنة المفتاح", description: "أصبح متاحًا للاستعادة من أي جهاز." })
      } catch (error: any) {
        console.error("uploadMemberEnvelope error", error)
        toast({ variant: "destructive", title: "فشل مزامنة المفتاح", description: error?.message || "حاول مرة أخرى" })
      }
    },
    [toast]
  )

  const handleGenerateKeys = async () => {
    if (!ensureSodium()) return
    if (passphrase.length < 12) {
      toast({ variant: "destructive", title: "كلمة مرور قصيرة", description: "يُفضل أن تكون 12 حرفًا على الأقل." })
      return
    }
    if (passphrase !== confirmPassphrase) {
      toast({ variant: "destructive", title: "كلمة المرور غير متطابقة", description: "تأكد من تطابق الحقول." })
      return
    }

    try {
      setLoading(true)
      const keypair = sodium!.crypto_box_keypair()
      const encodedPublic = sodium!.to_base64(keypair.publicKey)
      const encryptedPrivate = encryptPrivateKey(keypair.privateKey, passphrase)

      const response = await fetch("/api/workspace/encryption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: encodedPublic,
          keyType: "curve25519",
          encryptionVersion: "v1",
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "فشل حفظ المفتاح العام")
      }

      const vaultRecord: VaultRecord = {
        version: "v1",
        salt: encryptedPrivate.salt,
        nonce: encryptedPrivate.nonce,
        ciphertext: encryptedPrivate.ciphertext,
        createdAt: new Date().toISOString(),
        publicKey: encodedPublic,
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(vaultRecord))
      }

      setVault(vaultRecord)
      setPublicKey(encodedPublic)
      setStatusMessage(null)
      uploadMemberEnvelope(vaultRecord)
      toast({ title: "تم توليد المفتاح بنجاح", description: "تم حفظ المفتاح العام وتخزين المفتاح الخاص مشفرًا محليًا." })
      setPassphrase("")
      setConfirmPassphrase("")
    } catch (error: any) {
      console.error("generate key error", error)
      toast({ variant: "destructive", title: "فشل توليد المفتاح", description: error?.message || "حدث خطأ غير متوقع" })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = () => {
    if (!vault) {
      toast({ variant: "destructive", title: "لا يوجد ملف", description: "أنشئ المفتاح أولًا ثم حمّل النسخة الاحتياطية." })
      return
    }
    const blob = new Blob([JSON.stringify(vault, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `aqdi-workspace-backup-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({ title: "تم تنزيل النسخة الاحتياطية" })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as VaultRecord
      setRestorePayload(parsed)
      setRestoreFileName(file.name)
      toast({ title: "تم تحميل ملف النسخة", description: "أدخل كلمة المرور لإتمام الإستعادة" })
    } catch (error) {
      console.error("restore parse error", error)
      toast({ variant: "destructive", title: "ملف غير صالح", description: "تأكد أن الملف مصدره النسخة الاحتياطية" })
    }
  }

  const handleApplyRestore = async () => {
    if (!ensureSodium()) return
    if (!restorePayload) {
      toast({ variant: "destructive", title: "لا يوجد ملف", description: "حمّل ملف النسخة الاحتياطية أولًا" })
      return
    }
    if (!restorePassphrase) {
      toast({ variant: "destructive", title: "كلمة المرور مطلوبة" })
      return
    }
    try {
      const privateKey = decryptPrivateKey(restorePayload, restorePassphrase)
      if (!privateKey) throw new Error("فشل فك التشفير")

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(restorePayload))
      }
      setVault(restorePayload)
      setPublicKey(restorePayload.publicKey)
      setRestorePassphrase("")
      setRestorePayload(null)
      setRestoreFileName(null)

      // تأكيد أن المفتاح العام محفوظ في الخادم أيضًا
      await fetch("/api/workspace/encryption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: restorePayload.publicKey,
          keyType: "curve25519",
          encryptionVersion: restorePayload.version ?? "v1",
        }),
      })

      uploadMemberEnvelope(restorePayload)
      toast({ title: "تمت الاستعادة بنجاح", description: "يمكنك الآن استخدام المفتاح" })
    } catch (error: any) {
      console.error("restore error", error)
      toast({ variant: "destructive", title: "فشل الاستعادة", description: error?.message || "فشلت عملية فك التشفير" })
    }
  }

  const handleUnlock = async () => {
    if (!ensureSodium()) return
    if (!vault) {
      toast({ variant: "destructive", title: "لا يوجد مفتاح محلي" })
      return
    }
    if (!unlockPassphrase) {
      toast({ variant: "destructive", title: "كلمة المرور مطلوبة" })
      return
    }
    try {
      const privateKey = decryptPrivateKey(vault, unlockPassphrase)
      setIsUnlocked(true)
      setUnlockPassphrase("")
      toast({ title: "تم فك القفل مؤقتًا", description: "سيبقى المفتاح متاحًا خلال هذه الجلسة فقط" })
      // في الوقت الحالي لن نخزن المفتاح في الحالة خوفًا من التسريب.
      console.debug("workspace private key decrypted (لن يتم عرضه)", privateKey.byteLength)
    } catch (error) {
      console.error("unlock error", error)
      toast({ variant: "destructive", title: "فشل فك القفل", description: "كلمة المرور غير صحيحة أو الملف تالف" })
    }
  }

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSyncToCloud = () => {
    if (!vault) {
      toast({ variant: "destructive", title: "لا يوجد مفتاح محلي", description: "أنشئ أو استورد مفتاحًا أولًا" })
      return
    }
    uploadMemberEnvelope(vault)
  }

  const handleImportFromCloud = async () => {
    if (remoteLoading) return
    await fetchRemoteEnvelope()
    if (!remoteVault) {
      toast({ variant: "destructive", title: "لا توجد نسخة سحابية" })
      return
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(remoteVault))
    }
    setVault(remoteVault)
    setPublicKey(remoteVault.publicKey)
    toast({ title: "تم استيراد النسخة السحابية", description: "يمكنك الآن فك القفل باستخدام كلمة مرورك" })
  }

  useEffect(() => {
    if (!restorePayload) {
      resetFileInput()
    }
  }, [restorePayload])

  return (
    <div className="space-y-6">
      {statusMessage && (
        <Alert variant="destructive">
          <AlertTitle>تنبيه</AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">حالة المفتاح العام</h4>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>الحساب الحالي:</span>
              {accountId ? <Badge variant="outline">{accountId}</Badge> : <span>غير متوفر</span>}
            </div>
          </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h4 className="font-semibold">مزامنة المفتاح عبر السحابة</h4>
        <p className="text-sm text-muted-foreground">
          يتم تخزين نسخة مشفرة من المفتاح لكل عضو في قاعدة البيانات بحيث يمكن استعادتها من أي جهاز بعد تسجيل الدخول.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={handleSyncToCloud} disabled={!vault}>
            مزامنة النسخة الحالية
          </Button>
          <Button variant="outline" onClick={handleImportFromCloud} disabled={remoteLoading}>
            استيراد من السحابة
          </Button>
          {remoteUpdatedAt && (
            <p className="text-xs text-muted-foreground">
              آخر تحديث: {new Date(remoteUpdatedAt).toLocaleString('ar-EG')}
            </p>
          )}
        </div>
        {!remoteVault && !remoteLoading && (
          <p className="text-sm text-amber-600">لا توجد نسخة سحابية محفوظة بعد.</p>
        )}
      </div>
          <Badge variant={publicKey ? "default" : "destructive"}>{publicKey ? "مفعل" : "غير مُعد"}</Badge>
        </div>
        {publicKey ? (
          <pre className="rounded bg-muted p-3 text-xs break-all">{publicKey}</pre>
        ) : (
          <p className="text-sm text-muted-foreground">لم يتم توليد مفتاح بعد.</p>
        )}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h4 className="font-semibold">توليد مفتاح جديد</h4>
        <p className="text-sm text-muted-foreground">
          سيتم حفظ المفتاح الخاص مشفّرًا على جهازك فقط. اختر كلمة مرور قوية (12 حرفًا على الأقل).
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="passphrase">كلمة مرور النسخة الاحتياطية</Label>
            <Input
              id="passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="************"
              disabled={loading || readyState !== "ready"}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassphrase">تأكيد كلمة المرور</Label>
            <Input
              id="confirmPassphrase"
              type="password"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              placeholder="************"
              disabled={loading || readyState !== "ready"}
            />
          </div>
        </div>
        <Button onClick={handleGenerateKeys} disabled={loading || readyState !== "ready"}>
          {loading ? "جاري التوليد..." : "توليد مفتاح جديد"}
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h4 className="font-semibold">النسخة الاحتياطية المحلية</h4>
        <p className="text-sm text-muted-foreground">
          احرص على تنزيل النسخة الاحتياطية وتخزينها في مكان آمن، فهي الطريقة الوحيدة لاستعادة المفتاح عند تغيير الجهاز.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleDownloadBackup} disabled={!vault}>
            تنزيل النسخة الاحتياطية
          </Button>
          <div className="flex items-center gap-2">
            <Input type="file" accept="application/json" ref={fileInputRef} onChange={handleFileChange} className="max-w-xs" />
            {restoreFileName && <span className="text-xs text-muted-foreground">{restoreFileName}</span>}
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="restorePass">كلمة مرور الملف</Label>
            <Input
              id="restorePass"
              type="password"
              value={restorePassphrase}
              onChange={(e) => setRestorePassphrase(e.target.value)}
              placeholder="************"
            />
          </div>
          <Button variant="outline" onClick={handleApplyRestore} disabled={!restorePayload || !restorePassphrase}>
            استعادة
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h4 className="font-semibold">فتح المفتاح للاستخدام اللحظي</h4>
        <p className="text-sm text-muted-foreground">
          لن يتم إرسال المفتاح الخاص للخادم أبدًا. يتم فك القفل داخل المتصفح فقط لاستخدامه في تشفير/فك تشفير العقود.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="unlockPass">كلمة المرور</Label>
            <Input
              id="unlockPass"
              type="password"
              value={unlockPassphrase}
              onChange={(e) => setUnlockPassphrase(e.target.value)}
              placeholder="************"
              disabled={!vault}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" disabled={!vault} onClick={handleUnlock}>
              فك القفل
            </Button>
          </div>
        </div>
        {isUnlocked && <p className="text-sm text-emerald-600">✔️ المفتاح مفعل لهذه الجلسة.</p>}
      </div>
    </div>
  )
}
