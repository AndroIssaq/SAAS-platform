'use client'

/**
 * Contract Google Docs Generator Component
 * UI component for generating Google Docs contracts
 */

import { useState } from 'react'
import { getContractForPDF, validateContractForPDF } from '@/lib/actions/contract-pdf'
import { createContractDocument } from '@/lib/google/docs-generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Sparkles,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface ContractGoogleDocsGeneratorProps {
  contractId: string
  contractNumber: string
}

export function ContractGoogleDocsGenerator({ 
  contractId, 
  contractNumber 
}: ContractGoogleDocsGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [missingItems, setMissingItems] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Check if contract is ready
  const checkReadiness = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const validation = await validateContractForPDF(contractId)
      setIsReady(validation.ready)
      setMissingItems(validation.missingItems)

      if (validation.ready) {
        toast.success('✅ العقد جاهز للإنشاء', {
          description: 'جميع المستندات والإثباتات متوفرة',
        })
      }
    } catch (err: any) {
      setError(err.message)
      toast.error('حدث خطأ في التحقق')
    } finally {
      setIsLoading(false)
    }
  }

  // Generate Google Doc
  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      toast.info('🔄 جاري إنشاء المستند...', {
        description: 'قد يستغرق هذا بضع ثوانٍ',
      })

      // Fetch contract data
      const result = await getContractForPDF(contractId)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'فشل في جلب بيانات العقد')
      }

      // Create Google Doc
      const docResult = await createContractDocument(result.data)

      if (!docResult.success || !docResult.documentUrl) {
        throw new Error(docResult.error || 'فشل في إنشاء المستند')
      }

      setDocumentUrl(docResult.documentUrl)
      setDocumentId(docResult.documentId!)

      toast.success('🎉 تم إنشاء المستند بنجاح!', {
        description: 'يمكنك الآن فتحه في Google Docs',
        duration: 5000,
      })

    } catch (err: any) {
      setError(err.message)
      toast.error('حدث خطأ في الإنشاء', {
        description: err.message,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Open in new tab
  const handleOpen = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank')
      toast.success('تم فتح المستند في نافذة جديدة')
    }
  }

  // Download as PDF
  const handleDownloadPDF = () => {
    if (documentId) {
      const pdfUrl = `https://docs.google.com/document/d/${documentId}/export?format=pdf`
      window.open(pdfUrl, '_blank')
      toast.success('جاري تحميل نسخة PDF')
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-6 w-6 text-primary" />
              إنشاء عقد Google Docs
            </CardTitle>
            <CardDescription>
              مستند احترافي بالعربية مع جميع الإثباتات القانونية
            </CardDescription>
          </div>
          
          {isReady && !documentUrl && (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 ml-1" />
              جاهز للإنشاء
            </Badge>
          )}

          {documentUrl && (
            <Badge className="bg-blue-600">
              <Sparkles className="h-3 w-3 ml-1" />
              تم الإنشاء
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <Alert className="bg-blue-50 border-blue-200">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-900">
              جاري التحقق من اكتمال العقد...
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Missing Items Warning */}
        {!isLoading && !isReady && missingItems.length > 0 && !documentUrl && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <p className="font-semibold mb-2">
                ⚠️ العقد غير مكتمل - يجب إتمام الخطوات التالية:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {missingItems.map((item, index) => (
                  <li key={index} className="text-sm">{item}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Ready State - Not Generated Yet */}
        {!isLoading && isReady && !documentUrl && (
          <>
            <Alert className="bg-green-50 border-green-200">
              <FileCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <p className="font-semibold">✅ العقد مكتمل وجاهز</p>
                <p className="text-sm mt-1">
                  يحتوي على جميع التوقيعات والإثباتات القانونية
                </p>
              </AlertDescription>
            </Alert>

            <Alert className="bg-blue-50 border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <p className="font-semibold mb-2">✨ مميزات Google Docs:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>دعم ممتاز للغة العربية</li>
                  <li>سهولة المشاركة والتعديل</li>
                  <li>يمكن تصديره كـ PDF</li>
                  <li>حفظ تلقائي على Google Drive</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري إنشاء المستند...
                </>
              ) : (
                <>
                  <FileText className="ml-2 h-5 w-5" />
                  إنشاء عقد Google Docs
                </>
              )}
            </Button>
          </>
        )}

        {/* Document Generated */}
        {documentUrl && (
          <>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <p className="font-semibold">🎉 تم إنشاء المستند بنجاح!</p>
                <p className="text-sm mt-1">
                  المستند متاح الآن على Google Docs
                </p>
              </AlertDescription>
            </Alert>

            {/* Contract Info */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">رقم العقد:</span>
                <span className="font-mono font-semibold">{contractNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">الرابط:</span>
                <a 
                  href={documentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm truncate max-w-xs"
                >
                  {documentUrl}
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleOpen}
                className="w-full"
              >
                <ExternalLink className="ml-2 h-4 w-4" />
                فتح المستند
              </Button>

              <Button
                onClick={handleDownloadPDF}
                className="w-full"
              >
                <Download className="ml-2 h-4 w-4" />
                تحميل PDF
              </Button>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <p className="font-semibold mb-1">💡 نصائح:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>يمكنك تعديل المستند مباشرة من Google Docs</li>
                  <li>شارك الرابط مع العميل لمراجعة العقد</li>
                  <li>استخدم "تحميل PDF" للحصول على نسخة للطباعة</li>
                </ul>
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Check Readiness Button */}
        {!isLoading && !isReady && !documentUrl && (
          <Button
            variant="outline"
            onClick={checkReadiness}
            className="w-full"
          >
            <Loader2 className="ml-2 h-4 w-4" />
            التحقق من الجاهزية
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
