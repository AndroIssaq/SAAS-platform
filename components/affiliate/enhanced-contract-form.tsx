"use client"

import { ContractCreationView } from "@/components/contracts/creation/contract-creation-view"

interface EnhancedContractFormProps {
  affiliateId: string
  preSelectedServiceId?: string
  onSuccess?: (data: any) => void
  userRole?: 'admin' | 'affiliate'
  providerCompanyName?: string
  providerName?: string
}

export function EnhancedContractForm(props: EnhancedContractFormProps) {
  return <ContractCreationView {...props} />
}
