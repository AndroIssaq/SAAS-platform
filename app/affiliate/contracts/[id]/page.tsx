import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, FileText, User, Mail, Phone, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"
import { SendContractButton } from "@/components/affiliate/send-contract-button"
import { DeleteContractButton } from "@/components/affiliate/delete-contract-button"
import { getContractDeletionStatus } from "@/lib/actions/contract-deletion"
import { formatDate } from "@/lib/utils/date"
import { ContractSignaturesTab } from "@/components/contracts/contract-signatures-tab"
import { ContractStepRouter } from "@/components/contracts/contract-step-router"
import { ContractStepperRealtime } from "@/components/contracts/contract-stepper-realtime"
import { EncryptedContractViewer } from "@/components/contracts/encrypted-contract-viewer"

export default async function AffiliateContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get affiliate info
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!affiliate) {
    redirect("/")
  }

  // Get contract
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(`
      *,
      client:users!contracts_client_id_fkey(full_name, email, phone)
    `)
    .eq("id", id)
    .eq("affiliate_id", user.id)
    .maybeSingle()

  if (contractError) {
    console.error("Error fetching contract:", contractError)
    notFound()
  }

  if (!contract) {
    // Contract not found or deleted
    notFound()
  }

  // Get client info separately (optional)
  let clientInfo = null
  if (contract) {
    const { data: clientData } = await supabase
      .from("clients")
      .select("company_name, industry")
      .eq("user_id", contract.client_id)
      .single()
    
    clientInfo = clientData
  }

  // Check if there's a pending deletion request
  const deletionRequest = await getContractDeletionStatus(contract.id)

  const statusLabels: Record<string, string> = {
    draft: "مسودة",
    pending_admin_signature: "في انتظار توقيع المسؤول",
    pending_client_signature: "في انتظار توقيع العميل",
    pending_signature: "بانتظار التوقيع",
    signed: "موقع",
    active: "نشط",
    completed: "مكتمل",
    cancelled: "ملغي",
  }

  const statusColors: Record<string, string> = {
    draft: "secondary",
    pending_admin_signature: "default",
    pending_client_signature: "default",
    pending_signature: "default",
    signed: "default",
    active: "default",
    completed: "default",
    cancelled: "destructive",
  }

  // Use workflow_status if available, otherwise fall back to status
  const currentStatus = contract.workflow_status || contract.status

  const terms = contract.contract_terms?.terms || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center">
        <Button variant="ghost" asChild>
          <Link href="/affiliate/contracts">
            <ArrowLeft className="ml-2" />
            العودة للعقود
          </Link>
        </Button>
        <div className="flex gap-2">
          {contract.status === "draft" && <SendContractButton contractId={contract.id} />}
          <DeleteContractButton
            contractId={contract.id}
            contractNumber={contract.contract_number}
            hasPendingRequest={deletionRequest?.status === "pending"}
          />
        </div>
      </div>

      <EncryptedContractViewer
        encryptedPayload={contract.encrypted_payload}
        encryptionPublicKey={contract.encryption_public_key}
        contractNumber={contract.contract_number}
        serviceType={contract.service_type}
      />

      {/* Real-time Stepper */}
      {contract.current_step && contract.current_step > 1 && (
        <div className="mb-6">
          <ContractStepperRealtime 
            contractId={contract.id} 
            initialStep={contract.current_step}
            userRole="affiliate"
          />
        </div>
      )}

      {/* Step-based Content (for steps 2-8) */}
      {contract.current_step && contract.current_step > 1 ? (
        <ContractStepRouter contract={contract} userRole="affiliate" currentUserId={user.id} />
      ) : (
        // Original content for step 1 (draft)
        <div>

      <Card>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl">عقد تقديم خدمات</CardTitle>
          <p className="text-muted-foreground">شركة روبوويب للحلول التقنية</p>
          <div className="flex items-center justify-center gap-4">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-lg">
              <p className="text-sm font-mono">{contract.contract_number}</p>
            </div>
            <Badge variant={statusColors[currentStatus] as any}>
              {statusLabels[currentStatus] || currentStatus}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                معلومات العميل
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">الاسم:</span> {contract.client?.full_name}
                </p>
                {clientInfo?.company_name && (
                  <p>
                    <span className="text-muted-foreground">الشركة:</span> {clientInfo.company_name}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {contract.client?.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {contract.client?.phone}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                تفاصيل العقد
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">نوع الخدمة:</span> {contract.service_type}
                </p>
                <p>
                  <span className="text-muted-foreground">الباقة:</span> {contract.package_name}
                </p>
                <p>
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>{" "}
                  {formatDate(contract.created_at)}
                </p>
                {contract.signature_date && (
                  <p>
                    <span className="text-muted-foreground">تاريخ التوقيع:</span>{" "}
                    {formatDate(contract.signature_date)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              التفاصيل المالية
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">المبلغ الإجمالي</p>
                <p className="text-2xl font-bold">{Number(contract.total_amount).toLocaleString("ar-EG")} ج.م</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">العربون المدفوع (50% مقفول)</p>
                <p className="text-2xl font-bold text-primary">
                  {Number(contract.deposit_amount).toLocaleString("ar-EG")} ج.م
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">المبلغ المتبقي</p>
                <p className="text-2xl font-bold">
                  {Number(contract.remaining_amount).toLocaleString("ar-EG")} ج.م
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">طريقة الدفع:</span> {contract.payment_method}
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">شروط وأحكام العقد</h3>
            <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
              {terms.map((term: string, index: number) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
          </div>

        </CardContent>
      </Card>

      {/* Signatures Section */}
      <Card>
        <CardHeader>
          <CardTitle>التوقيعات</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractSignaturesTab
            adminSignature={contract.admin_signature_data}
            adminSignatureDate={contract.admin_signature_date}
            adminSignerName={contract.admin_signer?.full_name}
            clientSignature={contract.client_signature_data}
            clientSignatureDate={contract.client_signature_date}
            canSignAdmin={false}
            canSignClient={false}
            onSignClick={() => {}}
            isSigning={false}
          />
        </CardContent>
      </Card>
        </div>
      )}
    </div>
  )
}
