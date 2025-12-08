/**
 * Payment Proof Types - Enterprise Level
 */

export type PaymentMethod = 
  | 'bank_transfer'
  | 'vodafone_cash'
  | 'instapay'
  | 'orange_cash'
  | 'etisalat_cash'
  | 'other'

export type ReviewStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'under_review'

export interface PaymentProof {
  id: string
  contract_id: string
  payment_method: PaymentMethod
  amount: number
  currency: string
  transaction_reference?: string
  proof_image_url: string
  proof_image_path: string
  uploaded_by: string
  uploaded_at: string
  client_ip?: string
  client_ip_hash?: string
  user_agent?: string
  device_fingerprint?: string
  reviewed_by?: string
  reviewed_at?: string
  review_status: ReviewStatus
  review_notes?: string
  rejection_reason?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreatePaymentProofInput {
  contract_id: string
  payment_method: PaymentMethod
  amount: number
  transaction_reference?: string
  proof_image: File
  metadata?: Record<string, any>
}

export interface ReviewPaymentProofInput {
  payment_proof_id: string
  review_status: 'approved' | 'rejected'
  review_notes?: string
  rejection_reason?: string
}

export interface PaymentProofWithContract extends PaymentProof {
  contract: {
    contract_number: string
    client_name: string
    client_email: string
    service_type: string
    total_amount: number
  }
}

// Payment method labels in Arabic
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'تحويل بنكي',
  vodafone_cash: 'فودافون كاش',
  instapay: 'InstaPay',
  orange_cash: 'أورانج كاش',
  etisalat_cash: 'اتصالات كاش',
  other: 'طريقة أخرى',
}

// Review status labels in Arabic
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'قيد المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
  under_review: 'تحت المراجعة',
}

// Review status colors
export const REVIEW_STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
}
