/**
 * Payment Proofs Actions
 * Re-exports from new app/actions/payment-review
 */

export * from '@/app/actions/payment-review'

// Re-export specific functions for backward compatibility
import { getPendingPaymentProofs } from '@/app/actions/payment-review'

export { getPendingPaymentProofs }
