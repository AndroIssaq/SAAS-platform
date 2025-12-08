'use client'

import { useState, useEffect, useRef } from 'react'
import { useContractWorkflowStore } from '@/lib/stores/contract-workflow-store'
import { useContractFlowStore } from '@/lib/stores/contract-flow-store'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Upload, Check, Loader2, AlertCircle, FileImage, Clock, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Sparkles, Camera } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface PaymentProofProps {
  contractId: string
  accountId: string
  contractNumber: string
  depositAmount: number
  paymentMethod: string
  participant?: 'admin' | 'client'
  currentProof?: {
    id: string
    proof_image_url: string
    review_status: string
    rejection_reason?: string
    amount: number
    transaction_reference?: string
    proof_image_path?: string
  }
}

export function PaymentProof({
  contractId,
  accountId,
  contractNumber,
  depositAmount,
  paymentMethod,
  participant = 'client',
  currentProof
}: PaymentProofProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(currentProof?.proof_image_url || null)
  const [uploading, setUploading] = useState(false)
  const [transactionRef, setTransactionRef] = useState(currentProof?.transaction_reference || '')
  const [notes, setNotes] = useState('')

  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [errorDebug, setErrorDebug] = useState<string | null>(null)

  // Real-time state for payment proof
  const [livePaymentProof, setLivePaymentProof] = useState<typeof currentProof | null>(currentProof || null)
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null)

  // Fetch Signed URL when proof changes
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (livePaymentProof?.proof_image_path) {
        const supabase = createClient()
        const { data } = await supabase.storage
          .from('payment-proofs')
          .createSignedUrl(livePaymentProof.proof_image_path, 3600) // 1 hour expiry

        if (data?.signedUrl) {
          setSignedImageUrl(data.signedUrl)
        }
      } else if (livePaymentProof?.proof_image_url) {
        setSignedImageUrl(livePaymentProof.proof_image_url)
      }
    }

    fetchSignedUrl()
  }, [livePaymentProof?.proof_image_path, livePaymentProof?.proof_image_url])

  const isAdmin = participant === 'admin'
  const isClient = participant === 'client'

  // Get flow store for navigation
  const { flowState, performAction } = useContractFlowStore()

  // Real-time subscription for payment proof updates
  useEffect(() => {
    const supabase = createClient()

    // Subscribe to contract changes
    const channel = supabase
      .channel(`payment-proof-realtime:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts',
          filter: `id=eq.${contractId}`,
        },
        async (payload) => {
          console.log('📡 Payment proof updated:', payload)

          // Fetch updated payment proof data
          if (payload.new.payment_proof_id) {
            const { data: proofData } = await supabase
              .from('payment_proofs')
              .select('*')
              .eq('id', payload.new.payment_proof_id)
              .single()

            if (proofData) {
              setLivePaymentProof({
                id: proofData.id,
                proof_image_url: proofData.proof_image_url,
                review_status: proofData.review_status,
                rejection_reason: proofData.rejection_reason,
                amount: proofData.amount,
                transaction_reference: proofData.transaction_reference,
                proof_image_path: proofData.proof_image_path,
              })

              // Show toast notification
              if (isAdmin) {
                toast.success('💳 تحديث فوري', {
                  description: 'تم رفع إثبات الدفع من قبل العميل',
                })
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contractId, isAdmin])

  const handleNext = async () => {
    try {
      toast.info('الانتقال للخطوة التالية...')

      const supabase = createClient()

      // Mark payment_proof step as completed and move to next step
      const updateData: any = {
        current_step_name: 'payment_approval',
        payment_proof_uploaded_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId)

      if (error) throw error

      // Refresh page to load new step
      window.location.reload()
    } catch (error: any) {
      console.error('Error navigating to next step:', error)
      toast.error('حدث خطأ في الانتقال للخطوة التالية')
    }
  }

  const handlePrevious = async () => {
    try {
      toast.info('العودة للخطوة السابقة...')

      const supabase = createClient()

      // Update current step in database
      const { error } = await supabase
        .from('contracts')
        .update({
          current_step_name: 'id_cards'
        })
        .eq('id', contractId)

      if (error) throw error

      // Refresh page to load previous step
      window.location.reload()
    } catch (error: any) {
      console.error('Error navigating to previous step:', error)
      toast.error('حدث خطأ في العودة للخطوة السابقة')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type (images and PDFs)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('يرجى اختيار صورة (JPG, PNG) أو ملف PDF')
      return
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت')
      return
    }

    setFile(selectedFile)

    // Create preview for images only
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null) // PDF
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('يرجى اختيار ملف أولاً')
      return
    }

    // transaction_reference is now optional - no validation needed

    setUploading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('يرجى تسجيل الدخول')
        return
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${contractId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath)

      const sanitisedTransactionRef = transactionRef.trim() || null

      // Create payment proof record
      const { data: paymentProof, error: proofError } = await supabase
        .from('payment_proofs')
        .insert({
          contract_id: contractId,
          account_id: accountId,
          payment_method: paymentMethod,
          amount: depositAmount,
          currency: 'EGP',
          transaction_reference: sanitisedTransactionRef,
          proof_image_url: publicUrl,
          proof_image_path: filePath,
          uploaded_by: user.id,
          review_status: 'pending',
          metadata: {
            notes,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            actor: isAdmin ? 'admin' : 'client',
            onBehalfOf: isAdmin ? 'client' : undefined,
          }
        })
        .select()
        .single()

      if (proofError) throw proofError

      // Update contract
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          payment_proof_id: paymentProof.id,
          workflow_status: 'payment_proof_submitted',
          step_6_completed: true,
          step_6_data: {
            payment_proof_id: paymentProof.id,
            submitted_at: new Date().toISOString(),
            amount: depositAmount,
            transaction_reference: sanitisedTransactionRef,
            proof_image_url: publicUrl,
            proof_image_path: filePath
          }
        })
        .eq('id', contractId)

      if (updateError) throw updateError

      // Perform action in flow store (admin يمكنه التنفيذ نيابةً عن العميل)
      try {
        const result = await performAction('PAYMENT_PROOF_UPLOADED' as any, {
          onBehalfOf: isAdmin ? 'client' : undefined,
          payment_proof_id: paymentProof.id,
          amount: depositAmount,
          transaction_reference: sanitisedTransactionRef || undefined,
        })
        if (!result.success) {
          console.warn('performAction failed:', result.error)
        }
      } catch (e: any) {
        console.warn('performAction error:', e?.message || e)
      }

      // Log activity
      await supabase.from('contract_activities').insert({
        contract_id: contractId,
        activity_type: 'payment_proof_uploaded',
        description: isAdmin
          ? 'تم رفع إثبات الدفع بواسطة المدير نيابةً عن العميل'
          : 'تم رفع إثبات الدفع من قبل العميل',
        metadata: {
          payment_proof_id: paymentProof.id,
          amount: depositAmount,
          uploaded_by: user.id,
          actor: isAdmin ? 'admin' : 'client',
          onBehalfOf: isAdmin ? 'client' : undefined,
          timestamp: new Date().toISOString()
        }
      })

      // Notify admin (get admin user)
      const { data: contract } = await supabase
        .from('contracts')
        .select('created_by, affiliate_id')
        .eq('id', contractId)
        .single()

      if (contract) {
        // Notify contract creator (admin or affiliate)
        await supabase.from('notifications').insert({
          user_id: contract.created_by,
          type: 'payment_proof_submitted',
          title: '💳 إثبات دفع جديد',
          message: `تم رفع إثبات دفع للعقد ${contractNumber} - يرجى المراجعة`,
          link: `/admin/contracts/${contractId}`,
          related_id: contractId,
          status: 'sent',
          data: {
            contract_id: contractId,
            payment_proof_id: paymentProof.id
          }
        })
      }

      // Update live state immediately for client
      setLivePaymentProof({
        id: paymentProof.id,
        proof_image_url: publicUrl,
        review_status: 'pending',
        amount: depositAmount,
        transaction_reference: sanitisedTransactionRef || undefined,
        proof_image_path: filePath,
      })

      toast.success('✅ تم رفع إثبات الدفع بنجاح!', {
        description: 'الإثبات في انتظار المراجعة من قبل الإدارة'
      })

      setErrorDebug(null)

      // Clear form
      setFile(null)
      setNotes('')

    } catch (error: any) {
      console.error('Error uploading payment proof:', error)
      const detail = error?.message || error?.error_description || JSON.stringify(error)
      setErrorDebug(detail)
      toast.error('حدث خطأ في رفع إثبات الدفع', {
        description: error?.message || 'يرجى المحاولة مرة أخرى'
      })
    } finally {
      setUploading(false)
    }
  }

  // Get status badge - using live data
  const getStatusBadge = () => {
    if (!livePaymentProof) return null

    switch (livePaymentProof.review_status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
            <Clock className="w-3 h-3 ml-1" />
            قيد المراجعة
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-500 text-white hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 ml-1" />
            تم القبول
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 ml-1" />
            مرفوض
          </Badge>
        )
      default:
        return null
    }
  }

  // Admin view - waiting or reviewing
  if (isAdmin) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                👁️ إثبات الدفع - عرض المدير
              </CardTitle>
              <CardDescription>
                العميل مسؤول عن رفع إثبات الدفع
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Details */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-300">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">المبلغ المطلوب:</span>
                  <span className="font-bold text-lg">{depositAmount.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">طريقة الدفع:</span>
                  <span>{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">رقم العقد:</span>
                  <span className="font-mono">{contractNumber}</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {!livePaymentProof ? (
            <div className="space-y-4">
              <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-900 dark:text-yellow-300">
                  <p className="font-semibold">⏳ في انتظار العميل</p>
                  <p className="text-sm mt-1">لم يقم العميل برفع إثبات الدفع بعد.</p>
                </AlertDescription>
              </Alert>

              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  رفع الإثبات نيابة عن العميل
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  يمكنك رفع إثبات الدفع هنا إذا قام العميل بإرساله لك عبر وسيلة أخرى.
                </p>

                {/* Admin Upload Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-transaction-ref">رقم المعاملة / المرجع (اختياري)</Label>
                    <Input
                      id="admin-transaction-ref"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="أدخل رقم المعاملة"
                      disabled={uploading}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>ملف الإثبات</Label>

                    {/* Hidden inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
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

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={uploading}
                        className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-green-500/60 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="h-6 w-6 text-green-600" />
                        <span className="text-sm font-medium text-green-600">📷 الكاميرا</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:bg-muted/50 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <FileImage className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm font-medium">📁 ملف</span>
                      </button>
                    </div>

                    {file && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 text-sm">
                        <FileImage className="h-4 w-4 text-green-600" />
                        <span className="flex-1 truncate text-green-700 dark:text-green-300">{file.name}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري الرفع...
                      </>
                    ) : (
                      <>
                        <Upload className="ml-2 h-4 w-4" />
                        رفع الإثبات وتأكيده
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Display uploaded proof */}
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border rounded-lg">
                  <p className="text-sm font-semibold mb-2">معلومات الإثبات:</p>
                  {livePaymentProof.transaction_reference && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">رقم المعاملة:</span>
                      <span className="font-mono">{livePaymentProof.transaction_reference}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">المبلغ:</span>
                    <span className="font-semibold">{livePaymentProof.amount.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                </div>

                {/* Display proof image */}
                {livePaymentProof.proof_image_url && (
                  <div className="space-y-2">
                    <Label>صورة إثبات الدفع</Label>
                    <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-800">
                      <Image
                        src={signedImageUrl || livePaymentProof.proof_image_url}
                        alt="Payment Proof"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {livePaymentProof.review_status === 'pending' && (
                <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="text-yellow-900 dark:text-yellow-300">
                    ⏳ الإثبات في انتظار المراجعة. يمكنك مراجعته والموافقة عليه أو رفضه من الخطوة التالية.
                  </AlertDescription>
                </Alert>
              )}

              {livePaymentProof.review_status === 'approved' && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-900 dark:text-green-300">
                    ✅ تم قبول إثبات الدفع
                  </AlertDescription>
                </Alert>
              )}

              {livePaymentProof.review_status === 'rejected' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold">تم رفض إثبات الدفع</p>
                    {livePaymentProof.rejection_reason && (
                      <p className="text-sm mt-1">السبب: {livePaymentProof.rejection_reason}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Navigation Buttons - Admin */}
          <Separator className="my-4" />
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              الخطوة السابقة
            </Button>
            {livePaymentProof && (
              <Button
                onClick={handleNext}
                className="flex-1"
              >
                الخطوة التالية
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Client view - upload form
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              💳 إثبات الدفع
            </CardTitle>
            <CardDescription>
              يرجى رفع صورة أو ملف يثبت تحويل المبلغ المطلوب
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Details */}
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-900 dark:text-green-300">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">المبلغ المطلوب:</span>
                <span className="font-bold text-lg">{depositAmount.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">طريقة الدفع:</span>
                <span>{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">رقم العقد:</span>
                <span className="font-mono">{contractNumber}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Rejection Message */}
        {livePaymentProof?.review_status === 'rejected' && livePaymentProof.rejection_reason && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-1">سبب الرفض:</p>
              <p>{livePaymentProof.rejection_reason}</p>
              <p className="text-sm mt-2">يرجى رفع إثبات دفع جديد يراعي الملاحظات أعلاه.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        {livePaymentProof?.review_status !== 'approved' && (
          <>
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-300 text-sm">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>يجب أن تكون الصورة واضحة ويظهر بها المبلغ والتاريخ</li>
                  <li>الصيغ المدعومة: JPG, PNG, PDF</li>
                  <li>الحد الأقصى لحجم الملف: 10 ميجابايت</li>
                  <li>تأكد من كتابة رقم المرجع أو المعاملة بشكل صحيح</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Transaction Reference */}
            <div className="space-y-2">
              <Label htmlFor="transaction-ref">رقم المعاملة / المرجع (اختياري)</Label>
              <Input
                id="transaction-ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="أدخل رقم المعاملة أو المرجع (إن وجد)"
                disabled={uploading}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                rows={3}
                disabled={uploading}
              />
            </div>

            {/* File Input Section */}
            <div className="space-y-4">
              <Label>اختر ملف إثبات الدفع</Label>

              {/* Hidden inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
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

              {/* Upload options */}
              <div className="grid grid-cols-2 gap-4">
                {/* Camera capture button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-green-500/60 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-500 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors">
                    <Camera className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600 dark:text-green-400">📷 التقاط صورة</p>
                    <p className="text-xs text-muted-foreground mt-1">افتح الكاميرا</p>
                  </div>
                </button>

                {/* File picker button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-muted-foreground/30 rounded-xl hover:bg-muted/50 hover:border-muted-foreground/50 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-muted rounded-full group-hover:bg-muted/80 transition-colors">
                    <FileImage className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">📁 اختيار ملف</p>
                    <p className="text-xs text-muted-foreground mt-1">صورة أو PDF</p>
                  </div>
                </button>
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <FileImage className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300 flex-1 truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setFile(null); setPreview(null) }}
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>

            {/* Preview */}
            {preview && file?.type.startsWith('image/') && (
              <div className="space-y-2">
                <Label>معاينة الملف</Label>
                <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-800">
                  <Image
                    src={preview}
                    alt="Payment Proof Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {file && file.type === 'application/pdf' && (
              <Alert>
                <FileImage className="h-4 w-4" />
                <AlertDescription>
                  تم اختيار ملف PDF: {file.name}
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الرفع...
                </>
              ) : livePaymentProof ? (
                <>
                  <Upload className="ml-2 h-4 w-4" />
                  تحديث إثبات الدفع
                </>
              ) : (
                <>
                  <Upload className="ml-2 h-4 w-4" />
                  رفع إثبات الدفع
                </>
              )}
            </Button>

            {errorDebug && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  حدث خطأ تقني: {errorDebug}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Status Messages */}
        {livePaymentProof?.review_status === 'pending' && (
          <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-900 dark:text-yellow-300">
              ⏳ الإثبات في انتظار المراجعة من قبل الإدارة وسيصلك إشعار عند القبول.
            </AlertDescription>
          </Alert>
        )}

        {livePaymentProof?.review_status === 'approved' && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-900 dark:text-green-300">
              <p className="font-semibold">✅ تم قبول إثبات الدفع</p>
              <p className="text-sm mt-1">سيتم البدء في تنفيذ المشروع قريباً.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation Buttons - Client */}
        <Separator className="my-4" />
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex-1"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            الخطوة السابقة
          </Button>
          {currentProof && (
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              الخطوة التالية
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
