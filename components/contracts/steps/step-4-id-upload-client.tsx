'use client'

import { useState } from 'react'
import { useContractWorkflowStore } from '@/lib/stores/contract-workflow-store'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Check, Loader2, AlertCircle, FileImage } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface IDUploadClientProps {
  contractId: string
  currentIdCard?: string
}

export function IDUploadClient({ contractId, currentIdCard }: IDUploadClientProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(currentIdCard || null)
  const [uploading, setUploading] = useState(false)
  const { updateContractStep } = useContractWorkflowStore()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة فقط')
      return
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت')
      return
    }

    setFile(selectedFile)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('يرجى اختيار صورة أولاً')
      return
    }

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
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('id-cards')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('id-cards')
        .getPublicUrl(filePath)

      // Update contract with ID card URL
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          client_id_card: publicUrl,
          step_4_completed: true,
          step_4_data: {
            id_card_url: publicUrl,
            uploaded_at: new Date().toISOString(),
            uploaded_by: user.id
          }
        })
        .eq('id', contractId)

      if (updateError) throw updateError

      // Log activity
      await supabase.from('contract_activities').insert({
        contract_id: contractId,
        activity_type: 'id_card_uploaded',
        description: 'تم رفع بطاقة الهوية من قبل العميل',
        metadata: {
          uploaded_by: user.id,
          file_path: filePath,
          timestamp: new Date().toISOString()
        }
      })

      toast.success('✅ تم رفع بطاقة الهوية بنجاح!', {
        description: 'يمكنك الآن المتابعة للخطوة التالية'
      })

      // Update store
      await updateContractStep(contractId, 5)

    } catch (error: any) {
      console.error('Error uploading ID card:', error)
      toast.error('حدث خطأ في رفع الصورة', {
        description: error.message
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🪪 رفع بطاقة الهوية الوطنية
        </CardTitle>
        <CardDescription>
          يرجى رفع صورة واضحة لبطاقة الهوية الوطنية للتحقق القانوني
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>تأكد من وضوح الصورة وقراءة البيانات</li>
              <li>الصورة يجب أن تكون ملونة وواضحة</li>
              <li>الحد الأقصى لحجم الملف: 10 ميجابايت</li>
              <li>الصيغ المدعومة: JPG, PNG, JPEG</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* File Input */}
        <div className="space-y-2">
          <Label htmlFor="id-card-upload">اختر صورة بطاقة الهوية</Label>
          <div className="flex items-center gap-4">
            <Input
              id="id-card-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="flex-1"
            />
            {preview && (
              <FileImage className="h-5 w-5 text-green-600" />
            )}
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="space-y-2">
            <Label>معاينة الصورة</Label>
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
              <Image
                src={preview}
                alt="ID Card Preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الرفع...
              </>
            ) : currentIdCard ? (
              <>
                <Upload className="ml-2 h-4 w-4" />
                تحديث الصورة
              </>
            ) : (
              <>
                <Upload className="ml-2 h-4 w-4" />
                رفع الصورة
              </>
            )}
          </Button>
          
          {currentIdCard && (
            <Button variant="outline" size="lg" disabled>
              <Check className="ml-2 h-4 w-4 text-green-600" />
              تم الرفع
            </Button>
          )}
        </div>

        {/* Already uploaded message */}
        {currentIdCard && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 text-sm">
              تم رفع بطاقة الهوية بنجاح. يمكنك تحديث الصورة إذا أردت أو المتابعة للخطوة التالية.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
