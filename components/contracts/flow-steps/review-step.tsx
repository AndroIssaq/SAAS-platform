"use client"

/**
 * Review Step - Step 1
 * Both Admin and Client must review and approve the contract
 */

import { useState } from "react"
import { useContractFlowStore } from "@/lib/stores/contract-flow-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle2,
  FileText,
  DollarSign,
  Calendar,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react"
import type { ParticipantRole } from "@/lib/contract-flow/flow-state-machine"

interface ReviewStepProps {
  contractId: string
  participant: ParticipantRole
  contractData: any
  stepState: any
}

export function ReviewStep({ contractId, participant, contractData, stepState }: ReviewStepProps) {
  const [isApproving, setIsApproving] = useState(false)
  const { performAction, canPerformAction, flowState } = useContractFlowStore()

  const hasAffiliate = flowState.hasAffiliate

  const hasApproved = participant === 'admin' 
    ? stepState.adminCompleted 
    : participant === 'client'
    ? stepState.clientCompleted
    : stepState.affiliateCompleted

  const actionType = participant === 'admin' 
    ? 'ADMIN_REVIEW_APPROVED' 
    : participant === 'client'
    ? 'CLIENT_REVIEW_APPROVED'
    : 'AFFILIATE_REVIEW_APPROVED'

  // Check if all required participants have approved
  const allApproved = hasAffiliate
    ? stepState.adminCompleted && stepState.clientCompleted && stepState.affiliateCompleted
    : stepState.adminCompleted && stepState.clientCompleted

  const validation = canPerformAction(actionType as any)
  const clientValidation = canPerformAction('CLIENT_REVIEW_APPROVED' as any, 'client')

  const handleApprove = async () => {
    setIsApproving(true)
    const result = await performAction(actionType as any, {
      approvedAt: new Date().toISOString(),
    })
    
    if (!result.success) {
      alert(result.error)
    }
    setIsApproving(false)
  }

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {hasApproved && !allApproved && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>تمت موافقتك على العقد</strong>
            <p className="text-sm mt-1">
              {hasAffiliate 
                ? 'في انتظار موافقة جميع الأطراف للمتابعة'
                : `في انتظار موافقة ${participant === 'admin' ? 'العميل' : 'المدير'} للمتابعة`
              }
            </p>
          </AlertDescription>
        </Alert>
      )}

      {hasApproved && allApproved && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>✅ تم! {hasAffiliate ? 'جميع الأطراف وافقوا' : 'تمت الموافقة' } على العقد</strong>
            <p className="text-sm mt-1">
              يمكنك الآن الانتقال لخطوة التوقيعات
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Contract Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                تفاصيل العقد
              </CardTitle>
              <CardDescription className="mt-2">
                يرجى مراجعة جميع التفاصيل بعناية قبل الموافقة
              </CardDescription>
            </div>
            {hasApproved && (
              <Badge className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                وافقت
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contract Number & Service */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">رقم العقد</p>
              <p className="font-bold text-lg">{contractData.contract_number}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">نوع الخدمة</p>
              <p className="font-bold text-lg">{contractData.service_type}</p>
            </div>
          </div>

          <Separator />

          {/* Client Info */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-600">👤</span>
              معلومات العميل
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">الاسم</p>
                <p className="font-medium">{contractData.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                <p className="font-medium">{contractData.client_email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium">{contractData.client_phone}</p>
              </div>
              {contractData.company_name && (
                <div>
                  <p className="text-sm text-muted-foreground">اسم الشركة</p>
                  <p className="font-medium">{contractData.company_name}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Financial Details */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              التفاصيل المالية
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 mb-1">المبلغ الإجمالي</p>
                <p className="font-bold text-2xl text-green-900">
                  {Number(contractData.total_amount).toLocaleString('ar-EG')} ج.م
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700 mb-1">العربون</p>
                <p className="font-bold text-2xl text-orange-900">
                  {Number(contractData.deposit_amount).toLocaleString('ar-EG')} ج.م
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">المبلغ المتبقي</p>
                <p className="font-bold text-2xl text-blue-900">
                  {Number(contractData.remaining_amount).toLocaleString('ar-EG')} ج.م
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Service Details */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              تفاصيل الخدمة
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">الباقة</p>
                <p className="font-medium">{contractData.package_name}</p>
              </div>
              {contractData.service_description && (
                <div>
                  <p className="text-sm text-muted-foreground">الوصف</p>
                  <p className="font-medium">{contractData.service_description}</p>
                </div>
              )}
              {contractData.timeline && (
                <div>
                  <p className="text-sm text-muted-foreground">المدة الزمنية</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {contractData.timeline}
                  </p>
                </div>
              )}
              {contractData.deliverables && contractData.deliverables.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">المخرجات المتوقعة</p>
                  <ul className="list-disc list-inside space-y-1">
                    {contractData.deliverables.map((item: string, index: number) => (
                      <li key={index} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {contractData.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">ملاحظات إضافية</h4>
                <p className="text-sm text-muted-foreground">{contractData.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Approval Section */}
      {!hasApproved && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              إجراء مطلوب: الموافقة على العقد
            </CardTitle>
            <CardDescription>
              بالموافقة على العقد، أنت توافق على جميع البنود والشروط المذكورة أعلاه
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validation.allowed ? (
              <Button
                size="lg"
                className="w-full"
                onClick={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    جاري الموافقة...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 ml-2" />
                    أوافق على العقد
                  </>
                )}
              </Button>
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

      {/* Admin: Approve on behalf of Client */}
      {participant === 'admin' && !stepState.clientCompleted && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              إجراء مطلوب: موافقة العميل (تنفيذ من المدير)
            </CardTitle>
            <CardDescription>
              يمكنك إتمام موافقة العميل من لوحة المدير. سيتم تسجيل العملية على أنها تمت نيابةً عن العميل.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientValidation.allowed ? (
              <Button
                size="lg"
                className="w-full"
                onClick={async () => {
                  setIsApproving(true)
                  const result = await performAction('CLIENT_REVIEW_APPROVED' as any, {
                    approvedAt: new Date().toISOString(),
                    onBehalfOf: 'client',
                  })
                  if (!result.success) {
                    alert(result.error)
                  }
                  setIsApproving(false)
                }}
                disabled={isApproving}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    جاري الموافقة...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 ml-2" />
                    أوافق نيابةً عن العميل
                  </>
                )}
              </Button>
            ) : (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  {clientValidation.reason}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">حالة الموافقة</CardTitle>
          <CardDescription>
            {hasAffiliate ? 'يجب موافقة جميع الأطراف الثلاثة' : 'يجب موافقة كلا الطرفين'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${hasAffiliate ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {/* Admin */}
            <div className={`p-4 rounded-lg border-2 ${
              stepState.adminCompleted 
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
                    {stepState.adminCompleted ? 'وافق على العقد ✓' : 'في انتظار الموافقة'}
                  </p>
                </div>
              </div>
            </div>

            {/* Client */}
            <div className={`p-4 rounded-lg border-2 ${
              stepState.clientCompleted 
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
                    {stepState.clientCompleted ? 'وافق على العقد ✓' : 'في انتظار الموافقة'}
                  </p>
                </div>
              </div>
            </div>

            {/* Affiliate (if exists) */}
            {hasAffiliate && (
              <div className={`p-4 rounded-lg border-2 ${
                stepState.affiliateCompleted 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  {stepState.affiliateCompleted ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-gray-300" />
                  )}
                  <div>
                    <p className="font-semibold">الشريك</p>
                    <p className="text-sm text-muted-foreground">
                      {stepState.affiliateCompleted ? 'وافق على العقد ✓' : 'في انتظار الموافقة'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
