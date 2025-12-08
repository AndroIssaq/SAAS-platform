import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getContractById } from "@/app/actions/contracts"
import { DeleteContractButton } from "@/components/admin/delete-contract-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EncryptedContractViewer } from "@/components/contracts/encrypted-contract-viewer"

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Redirect old "new" route to the new "create" route
  if (id === "new") {
    redirect("/admin/contracts/create")
  }
  
  const result = await getContractById(id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const contract = result.data

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/admin/contracts">
            <ArrowLeft className="ml-2" />
            العودة للعقود
          </Link>
        </Button>
        
        <DeleteContractButton contractId={contract.id} contractNumber={contract.contract_number} />
      </div>

      {/* Contract Details */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">تفاصيل العقد</CardTitle>
                <CardDescription>معلومات العقد والحالة الحالية</CardDescription>
              </div>
              <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                {contract.status || 'قيد المعالجة'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">رقم العقد</label>
                <p className="text-lg font-semibold mt-1">{contract.contract_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">الخطوة الحالية</label>
                <p className="text-lg font-semibold mt-1">
                  الخطوة {contract.current_step || 1} من 8
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">اسم العميل</label>
                <p className="text-lg font-semibold mt-1">{contract.client_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                <p className="text-lg font-semibold mt-1">{contract.client_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">نوع الخدمة</label>
                <p className="text-lg font-semibold mt-1">{contract.service_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">المبلغ الإجمالي</label>
                <p className="text-lg font-semibold mt-1 text-primary">
                  {Number(contract.total_amount).toLocaleString('ar-EG')} ج.م
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">حالة سير العمل</label>
                <p className="text-lg font-semibold mt-1">{contract.workflow_status || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</label>
                <p className="text-lg font-semibold mt-1">
                  {contract.created_at ? new Date(contract.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <EncryptedContractViewer
          encryptedPayload={contract.encrypted_payload}
          encryptionPublicKey={contract.encryption_public_key}
          contractNumber={contract.contract_number}
          serviceType={contract.service_type}
        />

        {/* Contract Status Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              ℹ️ لعرض والتعديل على العقد، يمكنك استخدام صفحة تفاصيل العقد المخصصة للعميل أو الشريك.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
