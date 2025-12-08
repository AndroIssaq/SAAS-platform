"use client"

import { PaymentProof } from "@/components/contracts/steps/step-6-payment-proof"

export function PaymentProofStep({ contractId, participant, contractData }: any) {
  return (
    <PaymentProof
      contractId={contractId}
      accountId={contractData.account_id}
      contractNumber={contractData.contract_number}
      depositAmount={Number(contractData.deposit_amount)}
      paymentMethod={contractData.payment_method}
      participant={participant}
      currentProof={contractData.payment_proof_id ? {
        id: contractData.payment_proof_id,
        proof_image_url: contractData.payment_proof?.proof_image_url,
        review_status: contractData.payment_proof?.review_status,
        rejection_reason: contractData.payment_proof?.rejection_reason,
        amount: contractData.payment_proof?.amount,
        transaction_reference: contractData.payment_proof?.transaction_reference,
        proof_image_path: contractData.payment_proof?.proof_image_path
      } : undefined}
    />
  )
}
