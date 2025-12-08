import { ContractFlowWizard } from "@/components/contracts/contract-flow-wizard"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { decryptObject } from "@/lib/encryption"

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminContractFlowPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get user details
  const { data: userData } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single()

  if (userData?.role !== "admin") redirect("/")

  // Get contract first
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  console.log("📋 Admin Flow - Contract Query Result:", { contract, contractError, id })

  if (contractError) {
    console.error("❌ Contract query error:", contractError)
    redirect("/admin/contracts")
  }

  if (!contract || !contract.id) {
    console.error("❌ Contract not found for ID:", id)
    redirect("/admin/contracts")
  }

  // Get payment proof if exists
  let paymentProof = null
  if (contract.payment_proof_id) {
    const { data } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("id", contract.payment_proof_id)
      .single()
    paymentProof = data
  }

  // Add payment_proof to contract data and decrypt
  const decryptedContract = decryptObject(contract, [
    'client_name',
    'client_email',
    'client_phone',
    'company_name',
    'service_type',
    'package_name',
    'service_description',
    'payment_method',
    'notes'
  ])

  // Also decrypt step_1_data if exists
  if (contract.step_1_data?.client_info) {
    try {
      const { decrypt } = await import('@/lib/encryption')
      const clientInfo = contract.step_1_data.client_info
      decryptedContract.step_1_data = {
        ...contract.step_1_data,
        client_info: {
          name: decrypt(clientInfo.name) || clientInfo.name,
          email: decrypt(clientInfo.email) || clientInfo.email,
          phone: decrypt(clientInfo.phone) || clientInfo.phone,
          company: decrypt(clientInfo.company) || clientInfo.company
        },
        service_info: {
          type: decrypt(contract.step_1_data.service_info?.type) || contract.step_1_data.service_info?.type,
          package: decrypt(contract.step_1_data.service_info?.package) || contract.step_1_data.service_info?.package,
          amount: contract.step_1_data.service_info?.amount
        }
      }
    } catch (e) {
      // If decryption fails, keep original
    }
  }

  const contractData = {
    ...decryptedContract,
    payment_proof: paymentProof
  }

  return (
    <div className="container mx-auto py-8">
      <ContractFlowWizard
        contractId={id}
        participant="admin"
        participantName={userData.full_name || "Admin"}
        contractData={contractData}
      />
    </div>
  )
}
