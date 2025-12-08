"use client"

import { useContractFlowStore } from "@/lib/stores/contract-flow-store"
import { ReviewStep } from "@/components/contracts/flow-steps/review-step"
import { SignaturesStep } from "@/components/contracts/flow-steps/signatures-step"
import { OTPVerificationStep } from "@/components/contracts/flow-steps/otp-verification-step"
import { IDCardsStep } from "@/components/contracts/flow-steps/id-cards-step"
import { PaymentProofStep } from "@/components/contracts/flow-steps/payment-proof-step"
import { PaymentApprovalStep } from "@/components/contracts/flow-steps/payment-approval-step"
import { EncryptionExplanationStep } from "@/components/contracts/flow-steps/encryption-explanation-step"
import { FinalizationStep } from "@/components/contracts/flow-steps/finalization-step"
import type { ContractFlowStep, ParticipantRole } from "@/lib/contract-flow/flow-state-machine"

interface ContractStepRouterProps {
  currentStep: ContractFlowStep
  contractId: string
  participant: ParticipantRole
  contractData: any
  stepState: any
}

export function ContractStepRouter({
  currentStep,
  contractId,
  participant,
  contractData,
  stepState,
}: ContractStepRouterProps) {
  switch (currentStep) {
    case 'review':
      return (
        <ReviewStep
          contractId={contractId}
          participant={participant}
          contractData={contractData}
          stepState={stepState}
        />
      )

    case 'signatures':
      return (
        <SignaturesStep
          contractId={contractId}
          participant={participant}
          contractData={contractData}
          stepState={stepState}
        />
      )

    case 'otp_verification':
      return (
        <OTPVerificationStep
          contractId={contractId}
          participant={participant}
          contractData={contractData}
          stepState={stepState}
        />
      )

    case 'id_cards':
      return (
        <IDCardsStep
          contractId={contractId}
          participant={participant}
          contractData={contractData}
          stepState={stepState}
        />
      )

    case 'payment_proof':
      return (
        <PaymentProofStep
          contractId={contractId}
          participant={participant}
          contractData={contractData}
          stepState={stepState}
        />
      )

    case 'payment_approval':
      return (
        <PaymentApprovalStep
          contractId={contractId}
          participant={participant}
          contractData={contractData}
          stepState={stepState}
        />
      )

    case 'encryption_explanation':
      return (
        <EncryptionExplanationStep
          contractId={contractId}
          participant={participant}
          onContinue={async () => {
            const { performAction, currentParticipant } = useContractFlowStore.getState()
            // Allow admin to perform this action on behalf of client (for testing/demos)
            const metadata = currentParticipant === 'admin' ? { onBehalfOf: 'client' } : {}

            await performAction('ENCRYPTION_UNDERSTOOD', {
              understoodAt: new Date().toISOString(),
              ...metadata
            })
          }}
        />
      )

    case 'finalization':
      return (
        <FinalizationStep
          contractId={contractId}
          participant={participant}
          contractData={contractData}
          stepState={stepState}
        />
      )

    default:
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">خطوة غير معروفة</p>
        </div>
      )
  }
}
