/**
 * Contract Flow State Machine
 * Enterprise-grade state management for contract workflow
 * 
 * Architecture Pattern: Finite State Machine (FSM)
 * Principles: Single Source of Truth, Immutability, Predictable State Transitions
 */

export type ContractFlowStep =
  | 'review'               // Step 1: Review & Approval
  | 'signatures'           // Step 2: Electronic Signatures
  | 'otp_verification'     // Step 3: OTP Verification (Client Only)
  | 'id_cards'             // Step 4: ID Card Upload
  | 'payment_proof'        // Step 5: Payment Proof
  | 'payment_approval'     // Step 6: Admin Approval
  | 'encryption_explanation' // Step 7: Encryption Explanation (Client Only  )
  | 'finalization'         // Step 8: Contract Finalization

export type ParticipantRole = 'admin' | 'client' | 'affiliate'

export type ActionType =
  | 'ADMIN_REVIEW_APPROVED'
  | 'CLIENT_REVIEW_APPROVED'
  | 'AFFILIATE_REVIEW_APPROVED'
  | 'ADMIN_SIGNED'
  | 'CLIENT_SIGNED'
  | 'OTP_VERIFIED'
  | 'ADMIN_ID_UPLOADED'
  | 'CLIENT_ID_UPLOADED'
  | 'PAYMENT_PROOF_UPLOADED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'ENCRYPTION_UNDERSTOOD'
  | 'CONTRACT_FINALIZED'

export interface StepState {
  step: ContractFlowStep
  adminCompleted: boolean
  clientCompleted: boolean
  affiliateCompleted: boolean
  isBlocked: boolean
  blockReason?: string
  completedAt?: string
  requiresAffiliate?: boolean // Dynamic flag based on contract
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
    encryption_explanation: StepState
    finalization: StepState
  }
  canProceed: boolean
  isComplete: boolean
  hasAffiliate: boolean // Determines if this is a 2-party or 3-party contract
  affiliateId?: string | null
  lastAction?: {
    type: ActionType
    by: ParticipantRole
    at: string
  }
}

/**
 * Initial Flow State Factory
 * Creates initial state based on whether contract has affiliate
 */
export function createInitialFlowState(hasAffiliate: boolean, affiliateId?: string | null): FlowState {
  return {
    currentStep: 'review',
    hasAffiliate,
    affiliateId,
    steps: {
      review: {
        step: 'review',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: false,
        requiresAffiliate: hasAffiliate,
      },
      signatures: {
        step: 'signatures',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب الموافقة على العقد أولاً',
        requiresAffiliate: false, // Affiliate only watches
      },
      otp_verification: {
        step: 'otp_verification',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب التوقيع أولاً',
        requiresAffiliate: false, // Affiliate only watches
      },
      id_cards: {
        step: 'id_cards',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب التحقق من OTP أولاً',
        requiresAffiliate: false, // Affiliate only watches
      },
      payment_proof: {
        step: 'payment_proof',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب رفع بطاقات الهوية أولاً',
        requiresAffiliate: false, // Affiliate only watches
      },
      payment_approval: {
        step: 'payment_approval',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب رفع إثبات الدفع أولاً',
        requiresAffiliate: false, // Affiliate only watches
      },
      encryption_explanation: {
        step: 'encryption_explanation',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب الموافقة على الدفع أولاً',
        requiresAffiliate: false,
      },
      finalization: {
        step: 'finalization',
        adminCompleted: false,
        clientCompleted: false,
        affiliateCompleted: false,
        isBlocked: true,
        blockReason: 'يجب فهم آلية التشفير أولاً',
        requiresAffiliate: false,
      },
    },
    canProceed: false,
    isComplete: false,
  }
}

/**
 * Legacy export for backward compatibility
 */
export const initialFlowState: FlowState = createInitialFlowState(false)

/**
 * State Transition Rules
 * Defines what actions lead to which state changes
 * Dynamic based on hasAffiliate flag
 */
export const stateTransitions: Record<
  ContractFlowStep,
  {
    requiredActions: ActionType[]
    requiredActionsWithAffiliate?: ActionType[]
    nextStep: ContractFlowStep | null
    bothRequired: boolean
    allThreeRequired?: boolean // For 3-party contracts
  }
> = {
  review: {
    requiredActions: ['ADMIN_REVIEW_APPROVED', 'CLIENT_REVIEW_APPROVED'],
    requiredActionsWithAffiliate: ['ADMIN_REVIEW_APPROVED', 'CLIENT_REVIEW_APPROVED', 'AFFILIATE_REVIEW_APPROVED'],
    nextStep: 'signatures',
    bothRequired: true,
    allThreeRequired: true,
  },
  signatures: {
    requiredActions: ['ADMIN_SIGNED', 'CLIENT_SIGNED'],
    nextStep: 'otp_verification',
    bothRequired: true,
  },
  otp_verification: {
    requiredActions: ['OTP_VERIFIED'],
    nextStep: 'id_cards',
    bothRequired: false,
  },
  id_cards: {
    requiredActions: ['ADMIN_ID_UPLOADED', 'CLIENT_ID_UPLOADED'],
    nextStep: 'payment_proof',
    bothRequired: true,
  },
  payment_proof: {
    requiredActions: ['PAYMENT_PROOF_UPLOADED'],
    nextStep: 'payment_approval',
    bothRequired: false,
  },
  payment_approval: {
    requiredActions: ['PAYMENT_APPROVED'],
    nextStep: 'encryption_explanation',
    bothRequired: false,
  },
  encryption_explanation: {
    requiredActions: ['ENCRYPTION_UNDERSTOOD'],
    nextStep: 'finalization',
    bothRequired: false,
  },
  finalization: {
    requiredActions: ['CONTRACT_FINALIZED'],
    nextStep: null,
    bothRequired: false,
  },
}

/**
 * Action to Participant Mapping
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
  ENCRYPTION_UNDERSTOOD: 'client',
  CONTRACT_FINALIZED: 'admin',
}

/**
 * Pure function to compute next state
 * This is the heart of the state machine
 */
export function computeNextState(
  currentState: FlowState,
  action: ActionType,
  participant: ParticipantRole
): FlowState {
  // Validate action is allowed for this participant
  const allowedParticipant = actionParticipantMap[action]
  if (allowedParticipant !== 'either' && allowedParticipant !== participant) {
    console.error(`Action ${action} not allowed for ${participant}`)
    return currentState
  }

  // Clone current state (immutability)
  const newState: FlowState = JSON.parse(JSON.stringify(currentState))

  // Update step based on action
  const currentStepKey = newState.currentStep
  const stepState = newState.steps[currentStepKey]

  // Mark action as completed for the ACTUAL participant who performed it
  // CRITICAL: Use participant parameter, NOT action name!
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

  // Check if current step is complete
  const transition = stateTransitions[currentStepKey]

  // Dynamic completion check based on contract type
  let isStepComplete = false

  if (stepState.requiresAffiliate && newState.hasAffiliate) {
    // 3-party contract: requires all three participants
    isStepComplete = stepState.adminCompleted && stepState.clientCompleted && stepState.affiliateCompleted
  } else if (transition.bothRequired) {
    // 2-party contract: requires both admin and client
    isStepComplete = stepState.adminCompleted && stepState.clientCompleted
  } else {
    // Single participant required
    isStepComplete = stepState.adminCompleted || stepState.clientCompleted
  }

  if (isStepComplete) {
    stepState.completedAt = new Date().toISOString()
    stepState.isBlocked = false

    // Move to next step
    if (transition.nextStep) {
      newState.currentStep = transition.nextStep

      // Ensure the next step exists in the state (migration for old contracts)
      if (!newState.steps[transition.nextStep]) {
        const defaultState = createInitialFlowState(newState.hasAffiliate, newState.affiliateId)
        newState.steps[transition.nextStep] = defaultState.steps[transition.nextStep]
      }

      newState.steps[transition.nextStep].isBlocked = false
      newState.canProceed = true
    } else {
      // Flow complete
      newState.isComplete = true
    }
  }

  return newState
}

/**
 * Get current step progress
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
    'encryption_explanation',
    'finalization',
  ]

  const currentStepIndex = stepOrder.indexOf(state.currentStep)
  const completedSteps = stepOrder.filter(
    (step) => state.steps[step]?.completedAt
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
  // Check if action belongs to participant
  const allowedParticipant = actionParticipantMap[action]
  if (allowedParticipant !== 'either' && allowedParticipant !== participant) {
    return {
      allowed: false,
      reason: `هذا الإجراء مخصص لـ ${allowedParticipant === 'admin' ? 'المدير' : 'العميل'}`,
    }
  }

  // Check if current step allows this action
  const currentStep = state.steps[state.currentStep]
  if (currentStep.isBlocked) {
    return {
      allowed: false,
      reason: currentStep.blockReason,
    }
  }

  // Check if action already completed
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

  return { allowed: true }
}

/**
 * Get human-readable step name in Arabic
 */
export function getStepName(step: ContractFlowStep): string {
  const names: Record<ContractFlowStep, string> = {
    review: 'مراجعة والموافقة على العقد',
    signatures: 'التوقيعات الإلكترونية',
    otp_verification: 'التحقق عبر OTP',
    id_cards: 'رفع بطاقات الهوية',
    payment_proof: 'رفع إثبات الدفع',
    payment_approval: 'الموافقة على الدفع',
    encryption_explanation: 'شرح آلية التشفير',
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
    ENCRYPTION_UNDERSTOOD: 'العميل فهم آلية التشفير',
    CONTRACT_FINALIZED: 'تم إتمام العقد',
  }
  return descriptions[action]
}

/**
 * Get participant display name in Arabic
 */
export function getParticipantName(role: ParticipantRole): string {
  const names: Record<ParticipantRole, string> = {
    admin: 'المدير',
    client: 'العميل',
    affiliate: 'الشريك',
  }
  return names[role]
}
