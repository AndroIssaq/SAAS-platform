"use client"

/**
 * Signatures Step - Step 2
 * Electronic signature capture for both Admin and Client
 */

import { useState, useRef, useEffect } from "react"
import { useContractFlowStore } from "@/lib/stores/contract-flow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle2,
  Pen,
  Trash2,
  AlertCircle,
  Loader2,
  Eye,
  Sparkles,
} from "lucide-react"
import SignatureCanvas from "react-signature-canvas"
import type { ParticipantRole } from "@/lib/contract-flow/flow-state-machine"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Image from "next/image"
import { WorkspaceEncryption } from "@/lib/crypto/workspace-encryption"
import { useWorkspaceEncryption } from "@/hooks/use-workspace-encryption"

interface SignaturesStepProps {
  contractId: string
  participant: ParticipantRole
  contractData: any
  stepState: any
}

export function SignaturesStep({
  contractId,
  participant,
  contractData,
  stepState,
}: SignaturesStepProps) {
  const [isSigning, setIsSigning] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const sigCanvas = useRef<any>(null)
  // Admin acting on behalf of client
  const [isClientSigning, setIsClientSigning] = useState(false)
  const [clientSignatureData, setClientSignatureData] = useState<string | null>(null)
  const clientSigCanvas = useRef<any>(null)
  const { performAction, canPerformAction } = useContractFlowStore()

  // Real-time signatures state
  const [liveAdminSignature, setLiveAdminSignature] = useState(contractData.admin_signature)
  const [liveClientSignature, setLiveClientSignature] = useState(contractData.client_signature)

  const hasSigned = participant === 'admin'
    ? stepState.adminCompleted
    : stepState.clientCompleted

  const otherParticipantSigned = participant === 'admin'
    ? stepState.clientCompleted
    : stepState.adminCompleted

  const existingSignature = participant === 'admin'
    ? liveAdminSignature
    : liveClientSignature

  const otherSignature = participant === 'admin'
    ? liveClientSignature
    : liveAdminSignature

  const actionType = participant === 'admin' ? 'ADMIN_SIGNED' : 'CLIENT_SIGNED'
  const validation = canPerformAction(actionType as any)
  const clientSignValidation = canPerformAction('CLIENT_SIGNED' as any, 'client')

  // Real-time subscription for signatures
  useEffect(() => {
    const supabase = createClient()

    console.log('🔌 Setting up Real-time subscription for signatures:', contractId)

    const channel = supabase
      .channel(`contract-signatures:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts',
          filter: `id=eq.${contractId}`,
        },
        (payload) => {
          console.log('📝 Signature Real-time Update:', payload)

          const newContract = payload.new as any

          // Update admin signature
          if (newContract.admin_signature !== liveAdminSignature) {
            console.log('✍️ Admin signature updated!')
            setLiveAdminSignature(newContract.admin_signature)

            if (participant === 'client') {
              toast.success('توقيع المدير تم تحديثه!', {
                description: 'تم رفع توقيع المدير بنجاح',
                icon: '✍️',
              })
            }
          }

          // Update client signature
          if (newContract.client_signature !== liveClientSignature) {
            console.log('✍️ Client signature updated!')
            setLiveClientSignature(newContract.client_signature)

            if (participant === 'admin') {
              toast.success('توقيع العميل تم تحديثه!', {
                description: 'تم رفع توقيع العميل بنجاح',
                icon: '✍️',
              })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Signature subscription status:', status)
      })

    return () => {
      console.log('🔌 Unsubscribing from signatures')
      channel.unsubscribe()
    }
  }, [contractId, participant, liveAdminSignature, liveClientSignature])

  const handleClear = () => {
    sigCanvas.current?.clear()
    setSignatureData(null)
  }

  const handleClientClear = () => {
    clientSigCanvas.current?.clear()
    setClientSignatureData(null)
  }

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('يرجى التوقيع أولاً')
      return
    }

    const dataURL = sigCanvas.current?.toDataURL('image/png')
    setSignatureData(dataURL)
  }

  const handleClientSave = () => {
    if (clientSigCanvas.current?.isEmpty()) {
      alert('يرجى توقيع العميل أولاً')
      return
    }

    const dataURL = clientSigCanvas.current?.toDataURL('image/png')
    setClientSignatureData(dataURL)
  }

  const handleSubmit = async () => {
    if (!signatureData) {
      alert('يرجى حفظ التوقيع أولاً')
      return
    }

    setIsSigning(true)

    try {
      const supabase = createClient()

      // Upload signature to storage
      const fileName = `${contractId}_${participant}_${Date.now()}.png`
      const blob = await (await fetch(signatureData)).blob()

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName)

      // Update contract with signature URL
      const updateField = participant === 'admin' ? 'admin_signature' : 'client_signature'
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          [updateField]: urlData.publicUrl,
          [`${updateField}_at`]: new Date().toISOString(),
        })
        .eq('id', contractId)

      if (updateError) throw updateError

      // Perform action in store
      const result = await performAction(actionType as any, {
        signatureUrl: urlData.publicUrl,
        signedAt: new Date().toISOString(),
      })

      if (!result.success) {
        throw new Error(result.error)
      }

    } catch (error: any) {
      console.error('Signature error:', error)
      alert(error.message || 'حدث خطأ أثناء حفظ التوقيع')
    } finally {
      setIsSigning(false)
    }
  }

  const handleClientSubmit = async () => {
    if (!clientSignatureData) {
      alert('يرجى حفظ توقيع العميل أولاً')
      return
    }

    setIsClientSigning(true)

    try {
      const supabase = createClient()

      const fileName = `${contractId}_client_${Date.now()}.png`
      const blob = await (await fetch(clientSignatureData)).blob()

      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          client_signature: urlData.publicUrl,
          client_signature_at: new Date().toISOString(),
        })
        .eq('id', contractId)

      if (updateError) throw updateError

      const result = await performAction('CLIENT_SIGNED' as any, {
        signatureUrl: urlData.publicUrl,
        signedAt: new Date().toISOString(),
        onBehalfOf: 'client',
      })

      if (!result.success) {
        throw new Error(result.error)
      }

    } catch (error: any) {
      console.error('Client signature error:', error)
      alert(error.message || 'حدث خطأ أثناء حفظ توقيع العميل')
    } finally {
      setIsClientSigning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Alerts */}
      {hasSigned && !otherParticipantSigned && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>تم التوقيع بنجاح!</strong>
            <p className="text-sm mt-1">
              في انتظار توقيع {participant === 'admin' ? 'العميل' : 'المدير'} للمتابعة
            </p>
          </AlertDescription>
        </Alert>
      )}

      {hasSigned && otherParticipantSigned && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>✅ تم! كلا الطرفين وقع على العقد</strong>
            <p className="text-sm mt-1">
              يمكنك الآن الانتقال لخطوة بطاقات الهوية
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Signature Canvas - Current Participant */}
      {!hasSigned && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pen className="h-5 w-5 text-primary" />
              التوقيع الإلكتروني
            </CardTitle>
            <CardDescription>
              وقع في المربع أدناه باستخدام الفأرة أو شاشة اللمس
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation.allowed ? (
              <>
                <div className="border-2 border-dashed border-primary rounded-lg p-2 bg-background dark:bg-card">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className: 'w-full h-48 rounded',
                      style: { touchAction: 'none' }
                    }}
                    backgroundColor="white"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    مسح
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    معاينة
                  </Button>
                </div>

                {signatureData && (
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">معاينة التوقيع:</p>
                      <img
                        src={signatureData}
                        alt="Signature preview"
                        className="max-w-xs mx-auto border rounded"
                      />
                    </div>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleSubmit}
                      disabled={isSigning}
                    >
                      {isSigning ? (
                        <>
                          <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                          جاري حفظ التوقيع...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5 ml-2" />
                          تأكيد التوقيع
                        </>
                      )}
                    </Button>
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

      {/* Admin: Client Signature Canvas */}
      {participant === 'admin' && !stepState.clientCompleted && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pen className="h-5 w-5 text-blue-600" />
              توقيع العميل (ينفذه المدير)
            </CardTitle>
            <CardDescription>
              وقع بالنيابة عن العميل في المربع أدناه
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientSignValidation.allowed ? (
              <>
                <div className="border-2 border-dashed border-blue-500 rounded-lg p-2 bg-background dark:bg-card">
                  <SignatureCanvas
                    ref={clientSigCanvas}
                    canvasProps={{
                      className: 'w-full h-48 rounded',
                      style: { touchAction: 'none' }
                    }}
                    backgroundColor="white"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClientClear} className="flex-1">
                    <Trash2 className="h-4 w-4 ml-2" />
                    مسح
                  </Button>
                  <Button variant="outline" onClick={handleClientSave} className="flex-1">
                    <Eye className="h-4 w-4 ml-2" />
                    معاينة
                  </Button>
                </div>

                {clientSignatureData && (
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">معاينة توقيع العميل:</p>
                      <img src={clientSignatureData} alt="Client signature preview" className="max-w-xs mx-auto border rounded" />
                    </div>
                    <Button size="lg" className="w-full" onClick={handleClientSubmit} disabled={isClientSigning}>
                      {isClientSigning ? (
                        <>
                          <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                          جاري حفظ توقيع العميل...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5 ml-2" />
                          تأكيد توقيع العميل
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  {clientSignValidation.reason}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Signature Display */}
      {hasSigned && existingSignature && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              توقيعك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <img
                src={existingSignature}
                alt="Your signature"
                className="max-w-xs mx-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Signatures Display - Both Signatures */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
            التوقيعات المباشرة
            <Badge variant="outline" className="mr-auto bg-background dark:bg-card">
              Real-time
            </Badge>
          </CardTitle>
          <CardDescription>
            تحديثات فورية لتوقيعات الطرفين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Admin Signature */}
            <div className={`p-4 rounded-lg border-2 transition-all ${liveAdminSignature
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">توقيع المدير</p>
                {liveAdminSignature ? (
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
              {liveAdminSignature ? (
                <div className="bg-background dark:bg-card p-3 rounded border animate-in fade-in duration-500">
                  <img
                    src={liveAdminSignature}
                    alt="Admin signature"
                    className="w-full max-h-32 object-contain"
                  />
                </div>
              ) : (
                <div className="bg-background dark:bg-card p-8 rounded border border-dashed flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">في انتظار التوقيع...</p>
                </div>
              )}
            </div>

            {/* Client Signature */}
            <div className={`p-4 rounded-lg border-2 transition-all ${liveClientSignature
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">توقيع العميل</p>
                {liveClientSignature ? (
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
              {liveClientSignature ? (
                <div className="bg-background dark:bg-card p-3 rounded border animate-in fade-in duration-500">
                  <img
                    src={liveClientSignature}
                    alt="Client signature"
                    className="w-full max-h-32 object-contain"
                  />
                </div>
              ) : (
                <div className="bg-background dark:bg-card p-8 rounded border border-dashed flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">في انتظار التوقيع...</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الحالة:</span>
              <span className="font-semibold">
                {liveAdminSignature && liveClientSignature ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    اكتمل التوقيع من الطرفين ✓
                  </span>
                ) : liveAdminSignature || liveClientSignature ? (
                  <span className="text-blue-600">
                    توقيع واحد مكتمل - في انتظار الآخر...
                  </span>
                ) : (
                  <span className="text-gray-600">
                    لم يتم التوقيع بعد
                  </span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Participant's Signature - Old View (Hidden when Real-time is active) */}
      {false && otherParticipantSigned && otherSignature && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              توقيع {participant === 'admin' ? 'العميل' : 'المدير'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <img
                src={otherSignature}
                alt="Other signature"
                className="max-w-xs mx-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signatures Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">حالة التوقيعات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border-2 ${stepState.adminCompleted
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center gap-3">
                {stepState.adminCompleted ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300" />
                )}
                <div>
                  <p className="font-semibold">المدير</p>
                  <p className="text-sm text-muted-foreground">
                    {stepState.adminCompleted ? 'وقع على العقد ✓' : 'في انتظار التوقيع'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${stepState.clientCompleted
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center gap-3">
                {stepState.clientCompleted ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300" />
                )}
                <div>
                  <p className="font-semibold">العميل</p>
                  <p className="text-sm text-muted-foreground">
                    {stepState.clientCompleted ? 'وقع على العقد ✓' : 'في انتظار التوقيع'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
