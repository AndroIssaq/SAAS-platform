'use client'

/**
 * Contract HTML Generator Component
 * Beautiful Arabic contract with print and export capabilities
 */

import { useState } from 'react'
import { getContractForPDF, validateContractForPDF } from '@/lib/actions/contract-pdf'
import { generateProfessionalContractHTML } from './professional-contract-template'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Printer, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Download,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface ContractHTMLGeneratorProps {
  contractId: string
  contractNumber: string
}

export function ContractHTMLGenerator({ 
  contractId, 
  contractNumber 
}: ContractHTMLGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [missingItems, setMissingItems] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [contractData, setContractData] = useState<any>(null)

  // Check if contract is ready
  const checkReadiness = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const validation = await validateContractForPDF(contractId)
      setIsReady(validation.ready)
      setMissingItems(validation.missingItems)

      if (validation.ready) {
        // Fetch contract data
        const result = await getContractForPDF(contractId)
        if (result.success && result.data) {
          setContractData(result.data)
          toast.success('✅ العقد جاهز للعرض', {
            description: 'جميع المستندات والإثباتات متوفرة',
          })
        }
      }
    } catch (err: any) {
      setError(err.message)
      toast.error('حدث خطأ في التحقق')
    } finally {
      setIsLoading(false)
    }
  }

  // Open contract in new window for printing
  const handlePrint = () => {
    if (!contractData) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('فشل في فتح النافذة - تأكد من السماح بالنوافذ المنبثقة')
      return
    }

    printWindow.document.write(generateProfessionalContractHTML(contractData))
    printWindow.document.close()
    
    // Auto print
    setTimeout(() => {
      printWindow.print()
    }, 500)

    toast.success('تم فتح نافذة الطباعة')
  }

  // Open preview
  const handlePreview = () => {
    if (!contractData) return

    const previewWindow = window.open('', '_blank')
    if (!previewWindow) {
      toast.error('فشل في فتح النافذة - تأكد من السماح بالنوافذ المنبثقة')
      return
    }

    previewWindow.document.write(generateProfessionalContractHTML(contractData))
    previewWindow.document.close()

    toast.success('تم فتح معاينة العقد')
  }

  // Download as HTML
  const handleDownloadHTML = () => {
    if (!contractData) return

    const html = generateProfessionalContractHTML(contractData)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `عقد-${contractNumber}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('تم تحميل العقد بصيغة HTML')
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-6 w-6 text-primary" />
              طباعة وتصدير العقد الاحترافي
            </CardTitle>
            <CardDescription>
              عقد كامل ومنظم بجميع البنود والإثباتات القانونية
            </CardDescription>
          </div>
          
          {isReady && contractData && (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 ml-1" />
              جاهز
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
        {!isLoading && !isReady && missingItems.length > 0 && (
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

        {/* Ready State */}
        {!isLoading && isReady && contractData && (
          <>
            <Alert className="bg-green-50 border-green-200">
              <FileCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <p className="font-semibold">✅ العقد مكتمل وجاهز</p>
                <p className="text-sm mt-1">
                  يحتوي على جميع البنود والإثباتات القانونية
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
                <span className="text-sm text-muted-foreground">العميل:</span>
                <span className="font-semibold">{contractData.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">القيمة:</span>
                <span className="font-bold text-green-600">
                  {contractData.total_amount.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                className="w-full"
              >
                <Eye className="ml-2 h-4 w-4" />
                معاينة
              </Button>

              <Button
                onClick={handlePrint}
                className="w-full"
              >
                <Printer className="ml-2 h-4 w-4" />
                طباعة
              </Button>

              <Button
                variant="outline"
                onClick={handleDownloadHTML}
                className="w-full"
              >
                <Download className="ml-2 h-4 w-4" />
                تحميل HTML
              </Button>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <FileText className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <p className="font-semibold mb-2">💡 نصائح:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>استخدم "طباعة" للحصول على نسخة PDF (اختر "حفظ كـ PDF")</li>
                  <li>العقد يحتوي على جميع البنود القانونية المطلوبة</li>
                  <li>يمكنك رفع HTML لـ Google Docs يدوياً إذا أردت</li>
                  <li>العقد يدعم العربية بشكل كامل ✨</li>
                </ul>
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Check Button */}
        {!contractData && (
          <Button
            variant="outline"
            onClick={checkReadiness}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التحقق...
              </>
            ) : (
              <>
                <CheckCircle2 className="ml-2 h-4 w-4" />
                التحقق من الجاهزية
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
