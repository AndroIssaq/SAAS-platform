"use client"

/**
 * ID Cards Step - Step 4
 * Both Admin and Client upload their ID cards
 * Supports file upload and camera capture for mobile devices
 */

import { useState, useRef, useEffect } from "react"
import { useContractFlowStore } from "@/lib/stores/contract-flow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle2,
  Upload,
  X,
  AlertCircle,
  Loader2,
  FileImage,
  Sparkles,
  Camera,
} from "lucide-react"
import type { ParticipantRole } from "@/lib/contract-flow/flow-state-machine"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { toast } from "sonner"

interface IDCardsStepProps {
  contractId: string
  participant: ParticipantRole
  contractData: any
  stepState: any
}

export function IDCardsStep({
  contractId,
  participant,
  contractData,
  stepState,
}: IDCardsStepProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Admin: upload client ID card
  const [clientIsUploading, setClientIsUploading] = useState(false)
  const [clientPreview, setClientPreview] = useState<string | null>(null)
  const [clientSelectedFile, setClientSelectedFile] = useState<File | null>(null)
  const clientFileInputRef = useRef<HTMLInputElement>(null)
  const clientCameraInputRef = useRef<HTMLInputElement>(null)

  const { performAction, canPerformAction } = useContractFlowStore()

  // Real-time ID cards state
  const [liveAdminIDCard, setLiveAdminIDCard] = useState(contractData.admin_id_card)
  const [liveClientIDCard, setLiveClientIDCard] = useState(contractData.client_id_card)
  const [signedAdminIdUrl, setSignedAdminIdUrl] = useState<string | null>(null)
  const [signedClientIdUrl, setSignedClientIdUrl] = useState<string | null>(null)

  const getPathFromUrl = (url: string) => {
    if (!url) return null
    try {
      const parts = url.split('/id-cards/')
      if (parts.length > 1) return parts[1]
      return null
    } catch (e) {
      return null
    }
  }

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const supabase = createClient()

      if (liveAdminIDCard) {
        const path = getPathFromUrl(liveAdminIDCard)
        if (path) {
          const { data } = await supabase.storage
            .from('id-cards')
            .createSignedUrl(path, 3600)
          if (data?.signedUrl) setSignedAdminIdUrl(data.signedUrl)
        } else {
          setSignedAdminIdUrl(liveAdminIDCard)
        }
      }

      if (liveClientIDCard) {
        const path = getPathFromUrl(liveClientIDCard)
        if (path) {
          const { data } = await supabase.storage
            .from('id-cards')
            .createSignedUrl(path, 3600)
          if (data?.signedUrl) setSignedClientIdUrl(data.signedUrl)
        } else {
          setSignedClientIdUrl(liveClientIDCard)
        }
      }
    }

    fetchSignedUrls()
  }, [liveAdminIDCard, liveClientIDCard])

  const hasUploaded = participant === 'admin'
    ? stepState.adminCompleted
    : stepState.clientCompleted

  const otherParticipantUploaded = participant === 'admin'
    ? stepState.clientCompleted
    : stepState.adminCompleted

  const existingIDCard = participant === 'admin'
    ? liveAdminIDCard
    : liveClientIDCard

  const otherIDCard = participant === 'admin'
    ? liveClientIDCard
    : liveAdminIDCard

  const actionType = participant === 'admin' ? 'ADMIN_ID_UPLOADED' : 'CLIENT_ID_UPLOADED'
  const validation = canPerformAction(actionType as any)
  const clientValidation = canPerformAction('CLIENT_ID_UPLOADED' as any, 'client')

  // Real-time subscription for ID cards
  useEffect(() => {
    const supabase = createClient()

    console.log('🔌 Setting up Real-time subscription for ID cards:', contractId)

    const channel = supabase
      .channel(`contract-id-cards:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts',
          filter: `id=eq.${contractId}`,
        },
        (payload) => {
          console.log('🪪 ID Card Real-time Update:', payload)

          const newContract = payload.new as any

          // Update admin ID card
          if (newContract.admin_id_card !== liveAdminIDCard) {
            console.log('🪪 Admin ID card updated!')
            setLiveAdminIDCard(newContract.admin_id_card)

            if (participant === 'client') {
              toast.success('بطاقة هوية المدير تم رفعها!', {
                description: 'تم رفع بطاقة هوية المدير بنجاح',
                icon: '🪪',
              })
            }
          }

          // Update client ID card
          if (newContract.client_id_card !== liveClientIDCard) {
            console.log('🪪 Client ID card updated!')
            setLiveClientIDCard(newContract.client_id_card)

            if (participant === 'admin') {
              toast.success('بطاقة هوية العميل تم رفعها!', {
                description: 'تم رفع بطاقة هوية العميل بنجاح',
                icon: '🪪',
              })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 ID Cards subscription status:', status)
      })

    return () => {
      console.log('🔌 Unsubscribing from ID cards')
      channel.unsubscribe()
    }
  }, [contractId, participant, liveAdminIDCard, liveClientIDCard])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الملف يجب أن يكون أقل من 10 ميجا')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleClientFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الملف يجب أن يكون أقل من 10 ميجا')
      return
    }

    setClientSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setClientPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      const supabase = createClient()

      // Upload to storage
      const fileName = `${contractId}_${participant}_${Date.now()}.${selectedFile.name.split('.').pop()}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('id-cards')
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('id-cards')
        .getPublicUrl(fileName)

      // Update contract
      const updateField = participant === 'admin' ? 'admin_id_card' : 'client_id_card'
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          [updateField]: urlData.publicUrl,
        })
        .eq('id', contractId)

      if (updateError) throw updateError

      // Perform action in store
      const result = await performAction(actionType as any, {
        idCardUrl: urlData.publicUrl,
        uploadedAt: new Date().toISOString(),
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      setSelectedFile(null)
      setPreview(null)
    } catch (error: any) {
      console.error('ID Card upload error:', error)
      alert(error.message || 'حدث خطأ أثناء رفع بطاقة الهوية')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClientUpload = async () => {
    if (!clientSelectedFile) return

    setClientIsUploading(true)

    try {
      const supabase = createClient()

      const fileName = `${contractId}_client_${Date.now()}.${clientSelectedFile.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('id-cards')
        .upload(fileName, clientSelectedFile, {
          contentType: clientSelectedFile.type,
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('id-cards')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          client_id_card: urlData.publicUrl,
        })
        .eq('id', contractId)

      if (updateError) throw updateError

      const result = await performAction('CLIENT_ID_UPLOADED' as any, {
        idCardUrl: urlData.publicUrl,
        uploadedAt: new Date().toISOString(),
        onBehalfOf: 'client',
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      setClientSelectedFile(null)
      setClientPreview(null)
    } catch (error: any) {
      console.error('Client ID Card upload error:', error)
      alert(error.message || 'حدث خطأ أثناء رفع بطاقة هوية العميل')
    } finally {
      setClientIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Alerts */}
      {hasUploaded && !otherParticipantUploaded && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>تم رفع بطاقة الهوية!</strong>
            <p className="text-sm mt-1">
              في انتظار رفع {participant === 'admin' ? 'العميل' : 'المدير'} لبطاقة هويته
            </p>
          </AlertDescription>
        </Alert>
      )}

      {hasUploaded && otherParticipantUploaded && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>✅ تم! كلا الطرفين رفع بطاقة الهوية</strong>
            <p className="text-sm mt-1">
              يمكنك الآن الانتقال للخطوة التالية
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Card */}
      {!hasUploaded && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              رفع بطاقة الهوية
            </CardTitle>
            <CardDescription>
              صورة واضحة لبطاقة الهوية الوطنية (JPG, PNG - حتى 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation.allowed ? (
              <>
                {/* Hidden file input for gallery */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Hidden camera input - uses capture attribute for mobile */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!preview ? (
                  <div className="space-y-4">
                    {/* Upload options */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Camera capture button */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-primary/60 rounded-xl hover:bg-primary/5 hover:border-primary transition-all cursor-pointer group"
                      >
                        <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                          <Camera className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-primary">📷 التقاط صورة</p>
                          <p className="text-xs text-muted-foreground mt-1">افتح الكاميرا</p>
                        </div>
                      </button>

                      {/* File picker button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-muted-foreground/30 rounded-xl hover:bg-muted/50 hover:border-muted-foreground/50 transition-all cursor-pointer group"
                      >
                        <div className="p-4 bg-muted rounded-full group-hover:bg-muted/80 transition-colors">
                          <FileImage className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">📁 اختيار من المعرض</p>
                          <p className="text-xs text-muted-foreground mt-1">صورة موجودة</p>
                        </div>
                      </button>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                      يمكنك التقاط صورة مباشرة أو اختيار صورة موجودة من جهازك
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={preview}
                        alt="ID Card Preview"
                        className="w-full max-h-96 object-contain rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPreview(null)
                          setSelectedFile(null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        اختيار صورة أخرى
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleUpload}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                            جاري الرفع...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5 ml-2" />
                            رفع البطاقة
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  {validation.reason}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin: Client ID Upload Card */}
      {participant === 'admin' && !stepState.clientCompleted && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              رفع بطاقة هوية العميل (ينفذه المدير)
            </CardTitle>
            <CardDescription>
              صورة واضحة لبطاقة هوية العميل (JPG, PNG - حتى 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientValidation.allowed ? (
              <>
                {/* Hidden file input for gallery */}
                <input
                  ref={clientFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleClientFileSelect}
                  className="hidden"
                />

                {/* Hidden camera input */}
                <input
                  ref={clientCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleClientFileSelect}
                  className="hidden"
                />

                {!clientPreview ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Camera capture button */}
                      <button
                        type="button"
                        onClick={() => clientCameraInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-blue-500/60 rounded-xl hover:bg-blue-50 hover:border-blue-500 transition-all cursor-pointer group"
                      >
                        <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                          <Camera className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-blue-600">📷 التقاط صورة</p>
                          <p className="text-xs text-muted-foreground mt-1">افتح الكاميرا</p>
                        </div>
                      </button>

                      {/* File picker button */}
                      <button
                        type="button"
                        onClick={() => clientFileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-muted-foreground/30 rounded-xl hover:bg-muted/50 hover:border-muted-foreground/50 transition-all cursor-pointer group"
                      >
                        <div className="p-4 bg-muted rounded-full group-hover:bg-muted/80 transition-colors">
                          <FileImage className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">📁 اختيار من المعرض</p>
                          <p className="text-xs text-muted-foreground mt-1">صورة موجودة</p>
                        </div>
                      </button>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                      يمكنك التقاط صورة مباشرة أو اختيار صورة موجودة من جهازك
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img src={clientPreview} alt="Client ID Preview" className="w-full max-h-96 object-contain rounded-lg border" />
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => { setClientPreview(null); setClientSelectedFile(null) }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => clientFileInputRef.current?.click()}>
                        اختيار صورة أخرى
                      </Button>
                      <Button className="flex-1" onClick={handleClientUpload} disabled={clientIsUploading}>
                        {clientIsUploading ? (
                          <>
                            <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                            جاري الرفع...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5 ml-2" />
                            رفع بطاقة العميل
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">{clientValidation.reason}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* My ID Card - Hidden (using Real-time display instead) */}
      {false && hasUploaded && existingIDCard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              بطاقتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <img
                src={existingIDCard}
                alt="My ID Card"
                className="w-full max-h-96 object-contain rounded"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Participant's ID Card - Hidden (using Real-time display instead) */}
      {false && otherParticipantUploaded && otherIDCard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              بطاقة {participant === 'admin' ? 'العميل' : 'المدير'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <img
                src={otherIDCard}
                alt="Other ID Card"
                className="w-full max-h-96 object-contain rounded"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time ID Cards Display */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
            بطاقات الهوية المباشرة
            <Badge variant="outline" className="mr-auto bg-background dark:bg-card">
              Real-time
            </Badge>
          </CardTitle>
          <CardDescription>
            تحديثات فورية لبطاقات هوية الطرفين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Admin ID Card */}
            <div className={`p-4 rounded-lg border-2 transition-all ${liveAdminIDCard
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">بطاقة هوية المدير</p>
                {liveAdminIDCard ? (
                  <Badge className="bg-green-600 text-xs">
                    <CheckCircle2 className="h-3 w-3 ml-1" />
                    تم
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    معلق
                  </Badge>
                )}
              </div>
              {liveAdminIDCard ? (
                <div className="bg-background dark:bg-card p-2 rounded border animate-in fade-in duration-500">
                  <img
                    src={signedAdminIdUrl || liveAdminIDCard}
                    alt="Admin ID Card"
                    className="w-full max-h-48 object-contain rounded"
                  />
                </div>
              ) : (
                <div className="bg-background dark:bg-card p-12 rounded border border-dashed flex flex-col items-center justify-center">
                  <FileImage className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">في انتظار الرفع...</p>
                </div>
              )}
            </div>

            {/* Client ID Card */}
            <div className={`p-4 rounded-lg border-2 transition-all ${liveClientIDCard
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">بطاقة هوية العميل</p>
                {liveClientIDCard ? (
                  <Badge className="bg-green-600 text-xs">
                    <CheckCircle2 className="h-3 w-3 ml-1" />
                    تم
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    معلق
                  </Badge>
                )}
              </div>
              {liveClientIDCard ? (
                <div className="bg-background dark:bg-card p-2 rounded border animate-in fade-in duration-500">
                  <img
                    src={signedClientIdUrl || liveClientIDCard}
                    alt="Client ID Card"
                    className="w-full max-h-48 object-contain rounded"
                  />
                </div>
              ) : (
                <div className="bg-background dark:bg-card p-12 rounded border border-dashed flex flex-col items-center justify-center">
                  <FileImage className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">في انتظار الرفع...</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الحالة:</span>
              <span className="font-semibold">
                {liveAdminIDCard && liveClientIDCard ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    تم رفع البطاقات من الطرفين ✓
                  </span>
                ) : liveAdminIDCard || liveClientIDCard ? (
                  <span className="text-blue-600">
                    بطاقة واحدة مرفوعة - في انتظار الأخرى...
                  </span>
                ) : (
                  <span className="text-gray-600">
                    لم يتم رفع أي بطاقة بعد
                  </span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
