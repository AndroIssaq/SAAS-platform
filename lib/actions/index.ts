/**
 * Re-export all actions for backward compatibility
 * This file exists to support old imports using @/lib/actions/
 */

// Export from individual files
export * from './auth'
export * from './admin'
export * from './affiliates'
export * from './messages'
export * from './services'
export * from './onboarding'
export * from './projects'
export * from './portfolio'
export * from './contract-deletion'

export * from './email-logs'
export * from './contracts'
export * from './project-updates'

// Also export from app/actions for additional functions
export * from '@/app/actions'
