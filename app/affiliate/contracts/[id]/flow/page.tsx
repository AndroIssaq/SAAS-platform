import { ContractFlowWizard } from "@/components/contracts/contract-flow-wizard"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AffiliateContractFlowPage({ 
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
    
  if (userData?.role !== "affiliate") redirect("/")
  
  // Get contract - must belong to this affiliate
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .eq("affiliate_id", user.id)
    .maybeSingle()
    
  console.log("📋 Affiliate Flow - Contract Query Result:", { contract, contractError, id, affiliateId: user.id })
    
  if (contractError) {
    console.error("❌ Contract query error:", contractError)
    redirect("/affiliate/contracts")
  }
  
  if (!contract || !contract.id) {
    console.error("❌ Contract not found or doesn't belong to affiliate:", id)
    redirect("/affiliate/contracts")
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
  
  // Add payment_proof to contract data
  const contractData = {
    ...contract,
    payment_proof: paymentProof
  }

  // Affiliates act as admin in the flow
  return (
    <div className="container mx-auto py-8">
      <ContractFlowWizard
        contractId={id}
        participant="admin"
        participantName={userData.full_name || "Affiliate"}
        contractData={contractData}
      />
    </div>
  )
}
