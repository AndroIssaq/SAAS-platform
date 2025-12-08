'use client'

/**
 * Contract PDF Generator Component
 * UI component for generating and downloading contract PDFs
 */

import { useState, useEffect } from 'react'
import { PDFDownloadLink, BlobProvider } from '@react-pdf/renderer'
import { ContractPDF } from './pdf/contract-template'
import { getContractForPDF, validateContractForPDF, type ContractPDFData } from '@/lib/actions/contract-pdf'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Eye,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface ContractPDFGeneratorProps {
  contractId: string
  contractNumber: string
}

export function ContractPDFGenerator({ 
  contractId, 
  contractNumber 
}: ContractPDFGeneratorProps) {
  const [contractData, setContractData] = useState<ContractPDFData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [missingItems, setMissingItems] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load and validate contract data
  useEffect(() => {
    loadContractData()
  }, [contractId])

  const loadContractData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate contract first
      const validation = await validateContractForPDF(contractId)
      setIsReady(validation.ready)
      setMissingItems(validation.missingItems)

      if (!validation.ready) {
        setIsLoading(false)
        return
      }

      // Fetch contract data
      const result = await getContractForPDF(contractId)

      if (result.success && result.data) {
        setContractData(result.data)
        toast.success('✅ العقد جاهز للطباعة', {
          description: 'جميع المستندات والإثباتات متوفرة',
        })
      } else {
        setError(result.error || 'فشل في تحميل بيانات العقد')
        toast.error('خطأ', {
          description: result.error,
        })
      }
    } catch (err: any) {
      setError(err.message)
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle preview in new tab
  const handlePreview = async () => {
    if (!contractData) return

    toast.info('🔄 جاري إنشاء المعاينة...')
    
    // This will be handled by BlobProvider
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-6 w-6 text-primary" />
              طباعة العقد
            </CardTitle>
            <CardDescription>
              إنشاء وثيقة PDF احترافية مع جميع الإثباتات القانونية
            </CardDescription>
          </div>
          
          {isReady && (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 ml-1" />
              جاهز للطباعة
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

        {/* Ready State with Actions */}
        {!isLoading && isReady && contractData && (
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

            {/* Contract Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">رقم العقد</p>
                <p className="font-mono font-semibold">{contractNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العميل</p>
                <p className="font-semibold">{contractData.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الخدمة</p>
                <p className="font-semibold">{contractData.service_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">القيمة الإجمالية</p>
                <p className="font-bold text-green-600">
                  {contractData.total_amount.toLocaleString('ar-EG')} ج.م
                </p>
              </div>
            </div>

            {/* Included Proofs */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                الإثباتات المضمنة:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {contractData.admin_signature && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>توقيع المدير</span>
                  </div>
                )}
                {contractData.client_signature && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>توقيع العميل</span>
                  </div>
                )}
                {contractData.admin_id_card && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>بطاقة هوية المدير</span>
                  </div>
                )}
                {contractData.client_id_card && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>بطاقة هوية العميل</span>
                  </div>
                )}
                {contractData.payment_proof && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>إثبات الدفع</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {/* Preview Button */}
              <BlobProvider document={<ContractPDF contract={contractData} />}>
                {({ blob, url, loading, error }) => {
                  if (loading) {
                    return (
                      <Button variant="outline" disabled className="flex-1">
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري التحضير...
                      </Button>
                    )
                  }

                  if (error) {
                    return (
                      <Button variant="outline" disabled className="flex-1">
                        <AlertCircle className="ml-2 h-4 w-4" />
                        خطأ في المعاينة
                      </Button>
                    )
                  }

                  return (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        if (url) {
                          window.open(url, '_blank')
                          toast.success('تم فتح المعاينة في نافذة جديدة')
                        }
                      }}
                    >
                      <Eye className="ml-2 h-4 w-4" />
                      معاينة
                    </Button>
                  )
                }}
              </BlobProvider>

              {/* Download Button */}
              <PDFDownloadLink
                document={<ContractPDF contract={contractData} />}
                fileName={`عقد-${contractNumber}.pdf`}
                className="flex-1"
              >
                {({ blob, url, loading, error }) => (
                  <Button
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري التجهيز...
                      </>
                    ) : (
                      <>
                        <Download className="ml-2 h-4 w-4" />
                        تحميل العقد PDF
                      </>
                    )}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>

            {/* Info Note */}
            <Alert className="bg-blue-50 border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <p className="font-semibold mb-1">💡 ملاحظة:</p>
                <p>
                  سيتم إنشاء ملف PDF احترافي يحتوي على صفحتين:
                  الصفحة الأولى تحتوي على تفاصيل العقد والشروط،
                  والصفحة الثانية تحتوي على جميع الإثباتات القانونية (التوقيعات، بطاقات الهوية، إثبات الدفع).
                </p>
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Refresh Button */}
        {!isLoading && !isReady && (
          <Button
            variant="outline"
            onClick={loadContractData}
            className="w-full"
          >
            <Loader2 className="ml-2 h-4 w-4" />
            إعادة التحقق
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
