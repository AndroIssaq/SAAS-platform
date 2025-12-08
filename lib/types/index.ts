/**
 * Types Index - Central Export
 * مركز تصدير الأنواع (Types)
 */

// Contract System Types (V2 - Enterprise Level)
export * from './contract-system'

// Legacy Wizard Types (for backward compatibility)
export type {
  Step1Data,
  Step3Data,
  Step4Data,
  Step5Data
} from './contract-wizard'

// Re-export commonly used types with aliases
export type {
  Contract,
  UserRole,
  StepNumber,
  ContractStatus,
  WorkflowStatus,
  Service,
  RealtimeEvent,
  ValidationError,
  ValidationWarning
} from './contract-system'
