import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getContractById } from "@/app/actions/contracts"
import { createClient } from "@/lib/supabase/server"
import { EncryptedContractViewer } from "@/components/contracts/encrypted-contract-viewer"

export default async function ClientContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getContractById(id)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!result.success || !result.data || !user) {
    notFound()
  }

  const contract = result.data

  // Verify user is the client via clients table (contracts.client_id -> clients.id)
  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (clientError || !clientRow?.id || contract.client_id !== clientRow.id) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <Button variant="ghost" asChild>
          <Link href="/client/contracts">
            <ArrowLeft className="ml-2" />
            العودة للعقود
          </Link>
        </Button>
      </div>

      <EncryptedContractViewer
        encryptedPayload={contract.encrypted_payload}
        encryptionPublicKey={contract.encryption_public_key}
        contractNumber={contract.contract_number}
        serviceType={contract.service_type}
      />
    </div>
  )
}
