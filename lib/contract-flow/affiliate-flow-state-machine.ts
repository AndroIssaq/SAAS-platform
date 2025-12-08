/**
 * Affiliate Contract Flow State Machine - 3-PARTY WORKFLOW
 * For contracts between Admin + Client + Affiliate
 * 
 * This is a COMPLETELY SEPARATE workflow from the original 2-party
 * The original 2-party workflow (Admin + Client) is in flow-state-machine-original.ts
 */

export type ContractFlowStep = 
  | 'review'           // Step 1: Review & Approval (ALL 3 must approve)
  | 'signatures'       // Step 2: Electronic Signatures (Admin + Client)
  | 'otp_verification' // Step 3: OTP Verification (Client Only)
  | 'id_cards'         // Step 4: ID Card Upload (Admin + Client)
  | 'payment_proof'    // Step 5: Payment Proof (Client)
  | 'payment_approval' // Step 6: Admin Approval
  | 'finalization'     // Step 7: Contract Finalization

export type ParticipantRole = 'admin' | 'client' | 'affiliate'

export type ActionType =
  | 'ADMIN_REVIEW_APPROVED'
  | 'CLIENT_REVIEW_APPROVED'
  | 'AFFILIATE_REVIEW_APPROVED'  // NEW for 3-party
  | 'ADMIN_SIGNED'
  | 'CLIENT_SIGNED'
  | 'OTP_VERIFIED'
  | 'ADMIN_ID_UPLOADED'
  | 'CLIENT_ID_UPLOADED'
  | 'PAYMENT_PROOF_UPLOADED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'CONTRACT_FINALIZED'

export interface StepState {
  step: ContractFlowStep
  adminCompleted: boolean
  clientCompleted: boolean
  affiliateCompleted: boolean  // NEW for 3-party
  isBlocked: boolean
  blockReason?: string
  completedAt?: string
  requiresAffiliate?: boolean  // Flag for steps that need affiliate approval
}

export interface FlowState {
  currentStep: ContractFlowStep
  steps: {
    review: StepState
    signatures: StepState
    otp_verification: StepState
    id_cards: StepState
    payment_proof: StepState
    payment_approval: StepState
    finalization: StepState
  }
  canProceed: boolean
  isComplete: boolean
  hasAffiliate: true  // Always true for this workflow
  affiliateId: string
  lastAction?: {
    type: ActionType
    by: ParticipantRole
    at: string
  }
}

/**
 * Creates initial state for 3-party contract (with affiliate)
 */
export function createAffiliateFlowState(affiliateId: string): FlowState {
  return {
    currentStep: 'review',
    hasAffiliate: true,
    affiliateId,
    steps: {
      review: {
        step: 'review',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: false,
        requiresAffiliate: true,
      },
      signatures: {
        step: 'signatures',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب الموافقة على العقد أولاً',
        requiresAffiliate: false,
      },
      otp_verification: {
        step: 'otp_verification',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب التوقيع أولاً',
        requiresAffiliate: false,
      },
      id_cards: {
        step: 'id_cards',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب التحقق من OTP أولاً',
        requiresAffiliate: false,
      },
      payment_proof: {
        step: 'payment_proof',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب رفع بطاقات الهوية أولاً',
        requiresAffiliate: false,
      },
      payment_approval: {
        step: 'payment_approval',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب رفع إثبات الدفع أولاً',
        requiresAffiliate: false,
      },
      finalization: {
        step: 'finalization',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب الموافقة على الدفع أولاً',
        requiresAffiliate: false,
      },
    },
    canProceed: false,
    isComplete: false,
  }
}

/**
 * Compute next state for 3-party contracts
 * This handles the affiliate-specific logic
 */
export function computeAffiliateNextState(
  currentState: FlowState,
  action: ActionType,
  participant: ParticipantRole
): FlowState {
  // Clone state
  const newState: FlowState = JSON.parse(JSON.stringify(currentState))
  
  const currentStepKey = newState.currentStep
  const stepState = newState.steps[currentStepKey]

  // Mark completion for the ACTUAL participant
  if (participant === 'admin') {
    stepState.adminCompleted = true
  } else if (participant === 'client') {
    stepState.clientCompleted = true
  } else if (participant === 'affiliate') {
    stepState.affiliateCompleted = true
  }

  // Update last action
  newState.lastAction = {
    type: action,
    by: participant,
    at: new Date().toISOString(),
  }

  // Check if step is complete
  let isStepComplete = false
  
  if (stepState.requiresAffiliate) {
    // 3-party: requires all three
    isStepComplete = stepState.adminCompleted && 
                     stepState.clientCompleted && 
                     stepState.affiliateCompleted
  } else {
    // 2-party within 3-party contract: only admin + client
    isStepComplete = stepState.adminCompleted && stepState.clientCompleted
  }

  if (isStepComplete) {
    stepState.completedAt = new Date().toISOString()
    stepState.isBlocked = false

    // Move to next step
    const stepOrder: ContractFlowStep[] = [
      'review',
      'signatures',
      'otp_verification',
      'id_cards',
      'payment_proof',
      'payment_approval',
      'finalization',
    ]

    const currentIndex = stepOrder.indexOf(currentStepKey)
    if (currentIndex < stepOrder.length - 1) {
      newState.currentStep = stepOrder[currentIndex + 1]
      newState.steps[stepOrder[currentIndex + 1]].isBlocked = false
      newState.canProceed = true
    } else {
      newState.isComplete = true
    }
  }

  return newState
}

/**
 * Action to Participant Mapping - 3-Party
 */
export const actionParticipantMap: Record<ActionType, ParticipantRole | 'either'> = {
  ADMIN_REVIEW_APPROVED: 'admin',
  CLIENT_REVIEW_APPROVED: 'client',
  AFFILIATE_REVIEW_APPROVED: 'affiliate',
  ADMIN_SIGNED: 'admin',
  CLIENT_SIGNED: 'client',
  OTP_VERIFIED: 'client',
  ADMIN_ID_UPLOADED: 'admin',
  CLIENT_ID_UPLOADED: 'client',
  PAYMENT_PROOF_UPLOADED: 'client',
  PAYMENT_APPROVED: 'admin',
  PAYMENT_REJECTED: 'admin',
  CONTRACT_FINALIZED: 'admin',
}

/**
 * Get step progress
 */
export function getStepProgress(state: FlowState): {
  currentStepIndex: number
  totalSteps: number
  progressPercentage: number
  completedSteps: number
} {
  const stepOrder: ContractFlowStep[] = [
    'review',
    'signatures',
    'otp_verification',
    'id_cards',
    'payment_proof',
    'payment_approval',
    'finalization',
  ]

  const currentStepIndex = stepOrder.indexOf(state.currentStep)
  const completedSteps = stepOrder.filter(
    (step) => state.steps[step].completedAt
  ).length

  return {
    currentStepIndex,
    totalSteps: stepOrder.length,
    progressPercentage: (completedSteps / stepOrder.length) * 100,
    completedSteps,
  }
}

/**
 * Check if participant can perform action
 */
export function canPerformAction(
  state: FlowState,
  action: ActionType,
  participant: ParticipantRole
): { allowed: boolean; reason?: string } {
  const allowedParticipant = actionParticipantMap[action]
  if (allowedParticipant !== 'either' && allowedParticipant !== participant) {
    return {
      allowed: false,
      reason: `هذا الإجراء مخصص لـ ${getParticipantName(allowedParticipant as ParticipantRole)}`,
    }
  }

  const currentStep = state.steps[state.currentStep]
  if (currentStep.isBlocked) {
    return {
      allowed: false,
      reason: currentStep.blockReason,
    }
  }

  if (participant === 'admin' && currentStep.adminCompleted) {
    return {
      allowed: false,
      reason: 'لقد قمت بهذا الإجراء بالفعل',
    }
  }

  if (participant === 'client' && currentStep.clientCompleted) {
    return {
      allowed: false,
      reason: 'لقد قمت بهذا الإجراء بالفعل',
    }
  }

  if (participant === 'affiliate' && currentStep.affiliateCompleted) {
    return {
      allowed: false,
      reason: 'لقد قمت بهذا الإجراء بالفعل',
    }
  }

  return { allowed: true }
}

/**
 * Get step name in Arabic
 */
export function getStepName(step: ContractFlowStep): string {
  const names: Record<ContractFlowStep, string> = {
    review: 'مراجعة والموافقة على العقد',
    signatures: 'التوقيعات الإلكترونية',
    otp_verification: 'التحقق عبر OTP',
    id_cards: 'رفع بطاقات الهوية',
    payment_proof: 'رفع إثبات الدفع',
    payment_approval: 'الموافقة على الدفع',
    finalization: 'إتمام العقد',
  }
  return names[step]
}

/**
 * Get action description in Arabic
 */
export function getActionDescription(action: ActionType): string {
  const descriptions: Record<ActionType, string> = {
    ADMIN_REVIEW_APPROVED: 'المدير وافق على العقد',
    CLIENT_REVIEW_APPROVED: 'العميل وافق على العقد',
    AFFILIATE_REVIEW_APPROVED: 'الشريك وافق على العقد',
    ADMIN_SIGNED: 'المدير وقع العقد',
    CLIENT_SIGNED: 'العميل وقع العقد',
    OTP_VERIFIED: 'العميل تحقق عبر OTP',
    ADMIN_ID_UPLOADED: 'المدير رفع بطاقة الهوية',
    CLIENT_ID_UPLOADED: 'العميل رفع بطاقة الهوية',
    PAYMENT_PROOF_UPLOADED: 'العميل رفع إثبات الدفع',
    PAYMENT_APPROVED: 'المدير وافق على الدفع',
    PAYMENT_REJECTED: 'المدير رفض الدفع',
    CONTRACT_FINALIZED: 'تم إتمام العقد',
  }
  return descriptions[action]
}

/**
 * Get participant name in Arabic
 */
export function getParticipantName(role: ParticipantRole): string {
  const names: Record<ParticipantRole, string> = {
    admin: 'المدير',
    client: 'العميل',
    affiliate: 'الشريك',
  }
  return names[role]
}
