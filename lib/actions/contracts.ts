/**
 * Contracts Actions
 * Re-exports from app/actions/contracts for backward compatibility
 */

// Re-export everything from app/actions/contracts
export * from '@/app/actions/contracts'

// Import specific functions to re-export with names
import {
  createContract,
  updateContractStep,
  getContractById as getContractByIdFromApp
} from '@/app/actions/contracts'

// Re-export with explicit names
export { createContract, updateContractStep }
export { getContractByIdFromApp as getContractById }
