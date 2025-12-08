"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, FileSignature } from "lucide-react"
import { formatDate } from "@/lib/utils/date"

interface ContractSignaturesTabProps {
  contract: any
}

export function ContractSignaturesTab({ contract }: ContractSignaturesTabProps) {
  const adminSigned = !!contract.admin_signature
  const clientSigned = !!contract.client_signature
  const bothSigned = adminSigned && clientSigned

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            حالة التوقيعات
          </CardTitle>
          <CardDescription>
            {bothSigned
              ? "تم توقيع العقد من جميع الأطراف ✓"
              : "في انتظار التوقيعات من الأطراف"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Admin Signature */}
            <Card className={adminSigned ? "border-green-200 bg-green-50/50" : "border-gray-200"}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>توقيع المدير</span>
                  {adminSigned ? (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 ml-1" />
                      موقع
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 ml-1" />
                      في الانتظار
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {adminSigned ? (
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 bg-background dark:bg-card">
                      <img
                        src={contract.admin_signature}
                        alt="توقيع المدير"
                        className="max-h-24 mx-auto"
                      />
                    </div>
                    {contract.admin_signed_at && (
                      <p className="text-xs text-muted-foreground text-center">
                        تم التوقيع: {formatDate(contract.admin_signed_at)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileSignature className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">لم يتم التوقيع بعد</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Signature */}
            <Card className={clientSigned ? "border-green-200 bg-green-50/50" : "border-gray-200"}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>توقيع العميل</span>
                  {clientSigned ? (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 ml-1" />
                      موقع
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 ml-1" />
                      في الانتظار
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientSigned ? (
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 bg-background dark:bg-card">
                      <img
                        src={contract.client_signature}
                        alt="توقيع العميل"
                        className="max-h-24 mx-auto"
                      />
                    </div>
                    {contract.client_signed_at && (
                      <p className="text-xs text-muted-foreground text-center">
                        تم التوقيع: {formatDate(contract.client_signed_at)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileSignature className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">لم يتم التوقيع بعد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Contract Details */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل العقد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">رقم العقد</p>
              <p className="font-medium">{contract.contract_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">اسم العميل</p>
              <p className="font-medium">{contract.client_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">نوع الخدمة</p>
              <p className="font-medium">{contract.service_type}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">المبلغ الإجمالي</p>
              <p className="font-medium">{Number(contract.total_amount).toLocaleString('ar-EG')} ج.م</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
