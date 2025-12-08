'use client'

/**
 * Send Project Update Form (Admin)
 * نموذج إرسال تحديث للعميل
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  X,
  CheckCircle2,
} from 'lucide-react'
import { createProjectUpdate } from '@/lib/actions/project-updates'
import { toast } from 'sonner'

interface SendProjectUpdateFormProps {
  contractId: string
  clientId: string
  contractNumber: string
  clientName: string
  onSuccess?: () => void
}

export function SendProjectUpdateForm({
  contractId,
  clientId,
  contractNumber,
  clientName,
  onSuccess,
}: SendProjectUpdateFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    update_type: 'progress' as 'progress' | 'milestone' | 'completed' | 'feedback_needed' | 'issue',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  })
  const [attachments, setAttachments] = useState<Array<{
    type: 'image' | 'link'
    url: string
    caption?: string
    title?: string
  }>>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('يرجى إدخال عنوان التحديث')
      return
    }

    setLoading(true)

    try {
      const result = await createProjectUpdate({
        contract_id: contractId,
        client_id: clientId,
        title: formData.title,
        description: formData.description,
        update_type: formData.update_type,
        priority: formData.priority,
        attachments,
      })

      if (result.success) {
        toast.success('✅ تم إرسال التحديث بنجاح!', {
          description: `تم إرسال "${formData.title}" إلى ${clientName}`,
          duration: 5000,
        })
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          update_type: 'progress',
          priority: 'normal',
        })
        setAttachments([])
        
        onSuccess?.()
      } else {
        toast.error(result.error || 'فشل في إرسال التحديث', {
          description: 'يرجى المحاولة مرة أخرى',
          duration: 5000,
        })
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  const addAttachment = (type: 'image' | 'link') => {
    setAttachments([...attachments, { type, url: '', caption: '', title: '' }])
  }

  const updateAttachment = (index: number, field: string, value: string) => {
    const updated = [...attachments]
    updated[index] = { ...updated[index], [field]: value }
    setAttachments(updated)
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          إرسال تحديث للعميل
        </CardTitle>
        <CardDescription>
          عقد: {contractNumber} | العميل: {clientName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان التحديث *</Label>
            <Input
              id="title"
              placeholder="مثال: تم الانتهاء من الصفحة الرئيسية"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              placeholder="تفاصيل إضافية عن التحديث..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          {/* Update Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="update_type">نوع التحديث</Label>
              <Select
                value={formData.update_type}
                onValueChange={(value: any) => setFormData({ ...formData, update_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">تقدم في العمل</SelectItem>
                  <SelectItem value="milestone">إنجاز مرحلة</SelectItem>
                  <SelectItem value="completed">اكتمل العمل</SelectItem>
                  <SelectItem value="feedback_needed">يحتاج ملاحظات</SelectItem>
                  <SelectItem value="issue">مشكلة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">عادي</SelectItem>
                  <SelectItem value="normal">متوسط</SelectItem>
                  <SelectItem value="high">مهم</SelectItem>
                  <SelectItem value="urgent">عاجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <Label>مرفقات (صور / روابط)</Label>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAttachment('image')}
              >
                <ImageIcon className="h-4 w-4 ml-1" />
                إضافة صورة
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAttachment('link')}
              >
                <LinkIcon className="h-4 w-4 ml-1" />
                إضافة رابط
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-3">
                {attachments.map((attachment, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline">
                        {attachment.type === 'image' ? (
                          <>
                            <ImageIcon className="h-3 w-3 ml-1" />
                            صورة
                          </>
                        ) : (
                          <>
                            <LinkIcon className="h-3 w-3 ml-1" />
                            رابط
                          </>
                        )}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder={attachment.type === 'image' ? 'رابط الصورة' : 'رابط الموقع'}
                        value={attachment.url}
                        onChange={(e) => updateAttachment(index, 'url', e.target.value)}
                      />
                      <Input
                        placeholder={attachment.type === 'image' ? 'وصف الصورة (اختياري)' : 'عنوان الرابط (اختياري)'}
                        value={attachment.type === 'image' ? attachment.caption : attachment.title}
                        onChange={(e) =>
                          updateAttachment(
                            index,
                            attachment.type === 'image' ? 'caption' : 'title',
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 ml-2" />
                إرسال التحديث
              </>
            )}
          </Button>

          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>سيصل التحديث للعميل فوراً</li>
                <li>يمكنك إضافة صور أو روابط لمواقع</li>
                <li>سيحصل العميل على إشعار بالتحديث</li>
              </ul>
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  )
}
