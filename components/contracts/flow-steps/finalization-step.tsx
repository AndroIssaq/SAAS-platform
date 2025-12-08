"use client"

/**
 * Finalization Step - Step 7
 * Contract is complete!
 */

import { useState } from "react"
import { useContractFlowStore } from "@/lib/stores/contract-flow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  PartyPopper,
} from "lucide-react"
import type { ParticipantRole } from "@/lib/contract-flow/flow-state-machine"
import { createClient } from "@/lib/supabase/client"
import { finalizeContract } from "@/app/actions/contracts"
import { ContractHTMLGenerator } from "@/components/contracts/contract-html-generator"

interface FinalizationStepProps {
  contractId: string
  participant: ParticipantRole
  contractData: any
  stepState: any
}

export function FinalizationStep({
  contractId,
  participant,
  contractData,
  stepState,
}: FinalizationStepProps) {
  const [isFinalizing, setIsFinalizing] = useState(false)
  const { performAction } = useContractFlowStore()

  const isFinalized = stepState.adminCompleted

  const handleFinalize = async () => {
    setIsFinalizing(true)

    try {
      // Call server action to finalize contract (updates DB, logs activity, notifications + email)
      const res = await finalizeContract(contractId)
      if (!res.success) {
        throw new Error(res.error || 'تعذر إتمام العقد')
      }

      // Perform action in store
      const result = await performAction('CONTRACT_FINALIZED' as any, {
        finalizedAt: new Date().toISOString(),
      })

      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error('Finalization error:', error)
      alert(error.message || 'حدث خطأ أثناء إتمام العقد')
    } finally {
      setIsFinalizing(false)
    }
  }

  if (isFinalized) {
    return (
      <div className="space-y-6">
        {/* Success Card */}
        <Card className="border-4 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <PartyPopper className="h-20 w-20 text-green-600 mx-auto animate-bounce" />
            </div>
            <CardTitle className="text-3xl text-green-900 mb-2">
              🎊 تم إتمام العقد بنجاح! 🎉
            </CardTitle>
            <CardDescription className="text-lg text-green-700">
              تهانينا! جميع خطوات العقد مكتملة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-background dark:bg-card border-green-300 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-green-900">
                    رقم العقد: {contractData.contract_number}
                  </p>
                  <p className="text-sm text-green-700">
                    تم إتمام جميع الخطوات بنجاح. يمكنكم الآن البدء في تنفيذ المشروع.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Contract Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ملخص العقد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">نوع الخدمة</p>
                    <p className="font-semibold">{contractData.service_type}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                    <p className="font-bold text-lg text-green-600">
                      {Number(contractData.total_amount).toLocaleString('ar-EG')} ج.م
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">العميل</p>
                    <p className="font-semibold">{contractData.client_name}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-semibold">{contractData.client_email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </CardContent>
        </Card>

        {/* HTML Contract Generator */}
        <ContractHTMLGenerator
          contractId={contractId}
          contractNumber={contractData.contract_number}
        />

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>الخطوات التالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">بدء تنفيذ المشروع</p>
                  <p className="text-sm text-muted-foreground">
                    يمكنك الآن البدء في العمل على المشروع حسب الشروط المتفق عليها
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">التواصل المستمر</p>
                  <p className="text-sm text-muted-foreground">
                    استخدم نظام الرسائل للتواصل بشأن تفاصيل المشروع
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">متابعة التقدم</p>
                  <p className="text-sm text-muted-foreground">
                    تابع تقدم المشروع من خلال لوحة التحكم
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin - Not finalized yet
  if (participant === 'admin') {
    return (
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle>🎯 الخطوة الأخيرة: إتمام العقد</CardTitle>
          <CardDescription>
            جميع الخطوات مكتملة. اضغط الزر أدناه لإتمام العقد رسمياً.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <div className="space-y-2">
                <p className="font-semibold">✅ تمت جميع الخطوات المطلوبة:</p>
                <ul className="list-disc list-inside text-sm space-y-1 mr-4">
                  <li>الموافقة على العقد من كلا الطرفين</li>
                  <li>التوقيعات الإلكترونية</li>
                  <li>التحقق عبر OTP</li>
                  <li>رفع بطاقات الهوية</li>
                  <li>الموافقة على إثبات الدفع</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleFinalize}
            disabled={isFinalizing}
          >
            {isFinalizing ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                جاري إتمام العقد...
              </>
            ) : (
              <>
                <PartyPopper className="h-5 w-5 ml-2" />
                إتمام العقد رسمياً
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Client - Waiting
  return (
    <Card>
      <CardHeader>
        <CardTitle>⏳ في انتظار المدير</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            تم إكمال جميع الخطوات المطلوبة منك. في انتظار قيام المدير بإتمام العقد رسمياً.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
