/**
 * Contract Flow State Machine - ORIGINAL (2-Party: Admin + Client)
 * Enterprise-grade state management for contract workflow
 * 
 * Architecture Pattern: Finite State Machine (FSM)
 * Principles: Single Source of Truth, Immutability, Predictable State Transitions
 * 
 * THIS FILE IS FOR 2-PARTY CONTRACTS ONLY (Admin + Client)
 */

export type ContractFlowStep = 
  | 'review'           // Step 1: Review & Approval
  | 'signatures'       // Step 2: Electronic Signatures
  | 'otp_verification' // Step 3: OTP Verification (Client Only)
  | 'id_cards'         // Step 4: ID Card Upload
  | 'payment_proof'    // Step 5: Payment Proof
  | 'payment_approval' // Step 6: Admin Approval
  | 'finalization'     // Step 7: Contract Finalization

export type ParticipantRole = 'admin' | 'client'

export type ActionType =
  | 'ADMIN_REVIEW_APPROVED'
  | 'CLIENT_REVIEW_APPROVED'
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
  isBlocked: boolean
  blockReason?: string
  completedAt?: string
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
  lastAction?: {
    type: ActionType
    by: ParticipantRole
    at: string
  }
}

/**
 * Initial Flow State - 2-Party Contract
 */
export const initialFlowState: FlowState = {
  currentStep: 'review',
  steps: {
    review: {
      step: 'review',
      adminCompleted: false,
      clientCompleted: false,
      isBlocked: false,
    },
    signatures: {
      step: 'signatures',
      adminCompleted: false,
      clientCompleted: false,
      isBlocked: true,
      blockReason: 'يجب الموافقة على العقد أولاً',
    },
    otp_verification: {
      step: 'otp_verification',
      adminCompleted: false,
      clientCompleted: false,
      isBlocked: true,
      blockReason: 'يجب التوقيع أولاً',
    },
    id_cards: {
      step: 'id_cards',
      adminCompleted: false,
      clientCompleted: false,
      isBlocked: true,
      blockReason: 'يجب التحقق من OTP أولاً',
    },
    payment_proof: {
      step: 'payment_proof',
      adminCompleted: false,
      clientCompleted: false,
      isBlocked: true,
      blockReason: 'يجب رفع بطاقات الهوية أولاً',
    },
    payment_approval: {
      step: 'payment_approval',
      adminCompleted: false,
      clientCompleted: false,
      isBlocked: true,
      blockReason: 'يجب رفع إثبات الدفع أولاً',
    },
    finalization: {
      step: 'finalization',
      adminCompleted: false,
      clientCompleted: false,
      isBlocked: true,
      blockReason: 'يجب الموافقة على الدفع أولاً',
    },
  },
  canProceed: false,
  isComplete: false,
}

/**
 * State Transition Rules - 2-Party
 */
export const stateTransitions: Record<
  ContractFlowStep,
  {
    requiredActions: ActionType[]
    nextStep: ContractFlowStep | null
    bothRequired: boolean
  }
> = {
  review: {
    requiredActions: ['ADMIN_REVIEW_APPROVED', 'CLIENT_REVIEW_APPROVED'],
    nextStep: 'signatures',
    bothRequired: true,
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
 * Action to Participant Mapping - 2-Party
 */
export const actionParticipantMap: Record<ActionType, ParticipantRole | 'either'> = {
  ADMIN_REVIEW_APPROVED: 'admin',
  CLIENT_REVIEW_APPROVED: 'client',
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
 * Pure function to compute next state - 2-Party
 */
export function computeNextState(
  currentState: FlowState,
  action: ActionType,
  participant: ParticipantRole
): FlowState {
  // Validate action
  const allowedParticipant = actionParticipantMap[action]
  if (allowedParticipant !== 'either' && allowedParticipant !== participant) {
    console.error(`Action ${action} not allowed for ${participant}`)
    return currentState
  }

  // Clone state (immutability)
  const newState: FlowState = JSON.parse(JSON.stringify(currentState))
  
  const currentStepKey = newState.currentStep
  const stepState = newState.steps[currentStepKey]

  // Mark completion for participant
  if (participant === 'admin') {
    stepState.adminCompleted = true
  } else if (participant === 'client') {
    stepState.clientCompleted = true
  }

  // Update last action
  newState.lastAction = {
    type: action,
    by: participant,
    at: new Date().toISOString(),
  }

  // Check if step is complete
  const transition = stateTransitions[currentStepKey]
  let isStepComplete = false
  
  if (transition.bothRequired) {
    isStepComplete = stepState.adminCompleted && stepState.clientCompleted
  } else {
    isStepComplete = stepState.adminCompleted || stepState.clientCompleted
  }

  if (isStepComplete) {
    stepState.completedAt = new Date().toISOString()
    stepState.isBlocked = false

    // Move to next step
    if (transition.nextStep) {
      newState.currentStep = transition.nextStep
      newState.steps[transition.nextStep].isBlocked = false
      newState.canProceed = true
    } else {
      newState.isComplete = true
    }
  }

  return newState
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
      reason: `هذا الإجراء مخصص لـ ${allowedParticipant === 'admin' ? 'المدير' : 'العميل'}`,
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
  }
  return names[role]
}
