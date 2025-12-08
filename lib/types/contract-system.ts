/**
 * Contract System Types - Enterprise Level
 * نظام أنواع احترافي على مستوى المؤسسات الكبرى
 */

// ==================== Core Types ====================

export type UserRole = 'admin' | 'client' | 'affiliate'
export type ContractStatus = 'draft' | 'pending' | 'signed' | 'active' | 'completed' | 'cancelled'
export type WorkflowStatus = 'in_progress' | 'review' | 'approved' | 'rejected'
export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'overdue'
export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

// ==================== Contract Types ====================

export interface Contract {
  // Core Fields
  id: string
  contract_number: string
  status: ContractStatus
  workflow_status: WorkflowStatus
  
  // Client Information
  client_id?: string
  client_name: string
  client_email: string
  client_phone: string
  company_name?: string
  
  // Service Information
  service_id?: string
  service_type: string
  service_name: string
  service_description?: string
  package_name?: string
  
  // Financial Information
  total_amount: number
  deposit_amount: number
  remaining_amount: number
  payment_method: string
  payment_status: PaymentStatus
  currency: string
  
  // Timeline
  timeline?: string
  start_date?: Date
  end_date?: Date
  deliverables?: string[]
  
  // Progress Tracking
  current_step: StepNumber
  steps_completed: Record<`step_${StepNumber}_completed`, boolean>
  steps_data: Record<`step_${StepNumber}_data`, any>
  progress_percentage: number
  
  // Signatures & Documents
  admin_signature?: string
  client_signature?: string
  admin_signed_at?: Date
  client_signed_at?: Date
  admin_id_card?: string
  client_id_card?: string
  payment_proof?: string
  payment_proof_status?: 'pending' | 'approved' | 'rejected'
  
  // Metadata
  created_by?: string
  created_at: Date
  updated_at: Date
  contract_link?: string
  notes?: string
  custom_fields?: Record<string, any>
  
  // Relations
  affiliate_id?: string
  affiliate_commission?: number
  tags?: string[]
}

// ==================== Step Data Types ====================

export interface BaseStepData {
  completed_at?: Date
  completed_by?: string
  validation_errors?: string[]
  metadata?: Record<string, any>
}

export interface Step1Data extends BaseStepData {
  // Client Information
  client_name: string
  client_email: string
  client_phone: string
  company_name?: string
  
  // Service Selection
  service_id?: string
  service_type: string
  service_name: string
  service_description?: string
  
  // Financial
  total_amount: number
  deposit_amount: number
  remaining_amount: number
  payment_method: string
  currency?: string
  
  // Additional
  timeline?: string
  deliverables?: string[]
  notes?: string
  contract_terms?: {
    terms: string[]
    notes?: string
  }
}

export interface Step2Data extends BaseStepData {
  review_status: 'pending' | 'approved' | 'changes_requested'
  reviewer_notes?: string
  client_confirmed?: boolean
  admin_confirmed?: boolean
}

export interface Step3Data extends BaseStepData {
  admin_signature?: string
  admin_signed_at?: Date
  admin_signed_by?: string
  client_signature?: string
  client_signed_at?: Date
  signature_method?: 'draw' | 'upload' | 'type'
}

export interface Step4Data extends BaseStepData {
  admin_id_card?: string
  admin_id_uploaded_at?: Date
  client_id_card?: string
  client_id_uploaded_at?: Date
  id_verification_status?: 'pending' | 'verified' | 'rejected'
}

export interface Step5Data extends BaseStepData {
  otp_code?: string
  otp_sent_to?: string
  otp_sent_at?: Date
  otp_verified_at?: Date
  verification_attempts?: number
}

export interface Step6Data extends BaseStepData {
  payment_proof?: string
  payment_proof_uploaded_at?: Date
  payment_amount?: number
  payment_reference?: string
  payment_date?: Date
  payment_method?: string
}

export interface Step7Data extends BaseStepData {
  review_status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  approval_date?: Date
  approved_by?: string
  rejection_reason?: string
}

export interface Step8Data extends BaseStepData {
  completion_date: Date
  final_contract_url?: string
  delivery_status: 'pending' | 'in_progress' | 'delivered'
  client_feedback?: {
    rating: number
    comment?: string
  }
}

// ==================== Real-time Events ====================

export interface RealtimeEvent {
  id: string
  type: RealtimeEventType
  contractId: string
  userId: string
  userRole: UserRole
  timestamp: Date
  data: any
  metadata?: {
    deviceInfo?: string
    location?: string
    sessionId?: string
  }
}

export type RealtimeEventType = 
  | 'contract.created'
  | 'contract.updated'
  | 'contract.deleted'
  | 'step.started'
  | 'step.completed'
  | 'step.failed'
  | 'signature.added'
  | 'signature.removed'
  | 'document.uploaded'
  | 'document.deleted'
  | 'payment.initiated'
  | 'payment.completed'
  | 'otp.sent'
  | 'otp.verified'
  | 'review.requested'
  | 'review.completed'
  | 'notification.sent'
  | 'user.joined'
  | 'user.left'

// ==================== Validation Types ====================

export interface ValidationRule {
  field: string
  type: 'required' | 'email' | 'phone' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code?: string
  severity: 'error' | 'critical'
}

export interface ValidationWarning {
  field: string
  message: string
  code?: string
}

// ==================== Service Types ====================

export interface Service {
  id: string
  name: string
  name_en?: string
  category: ServiceCategory
  description?: string
  base_price: number
  currency: string
  price_type: 'fixed' | 'hourly' | 'monthly' | 'custom'
  features: string[]
  deliverables: string[]
  timeline?: string
  timeline_days?: number
  requirements?: string[]
  terms?: string[]
  payment_schedule?: PaymentSchedule[]
  has_packages: boolean
  packages?: ServicePackage[]
  add_ons?: ServiceAddOn[]
  is_active: boolean
  is_featured: boolean
  display_order: number
  tags?: string[]
  meta_title?: string
  thumbnail_url?: string
  gallery?: string[]
  total_contracts?: number
  total_revenue?: number
  average_rating?: number
  created_by?: string
  created_at: Date
  updated_at: Date
}

export type ServiceCategory = 
  | 'web-development'
  | 'mobile-app'
  | 'design'
  | 'marketing'
  | 'consulting'
  | 'ecommerce'
  | 'cms'
  | 'ai-ml'
  | 'blockchain'
  | 'cloud'
  | 'security'
  | 'other'

export interface ServicePackage {
  id: string
  name: string
  price: number
  features: string[]
  deliverables: string[]
  timeline: string
  is_popular?: boolean
}

export interface ServiceAddOn {
  id: string
  name: string
  price: number
  description?: string
}

export interface PaymentSchedule {
  phase: string
  percentage: number
  amount?: number
  due_date?: Date
  description?: string
}

// ==================== Notification Types ====================

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: any
  read: boolean
  sent_at: Date
  read_at?: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  action_url?: string
  action_text?: string
  expires_at?: Date
}

export type NotificationType = 
  | 'contract.new'
  | 'contract.updated'
  | 'step.reminder'
  | 'signature.required'
  | 'payment.required'
  | 'payment.received'
  | 'review.required'
  | 'contract.completed'
  | 'message.new'
  | 'system.announcement'

// ==================== Analytics Types ====================

export interface ContractAnalytics {
  total_contracts: number
  active_contracts: number
  completed_contracts: number
  total_revenue: number
  average_contract_value: number
  average_completion_time: number
  conversion_rate: number
  step_dropout_rates: Record<StepNumber, number>
  popular_services: Array<{
    service_id: string
    service_name: string
    count: number
    revenue: number
  }>
  client_satisfaction: {
    average_rating: number
    total_reviews: number
    nps_score: number
  }
  time_metrics: {
    average_per_step: Record<StepNumber, number>
    fastest_completion: number
    slowest_completion: number
  }
}

// ==================== Permission Types ====================

export interface Permission {
  resource: ResourceType
  action: ActionType
  condition?: (context: PermissionContext) => boolean
}

export type ResourceType = 
  | 'contract'
  | 'signature'
  | 'document'
  | 'payment'
  | 'review'
  | 'analytics'
  | 'settings'
  | 'users'

export type ActionType = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'sign'
  | 'upload'
  | 'download'
  | 'export'

export interface PermissionContext {
  user_id: string
  user_role: UserRole
  resource_id?: string
  resource_owner?: string
  additional_data?: any
}

// ==================== Error Types ====================

export interface SystemError {
  code: string
  message: string
  details?: string
  timestamp: Date
  context?: {
    user_id?: string
    contract_id?: string
    step?: StepNumber
    action?: string
  }
  stack?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// ==================== Configuration Types ====================

export interface SystemConfiguration {
  features: {
    realtime_sync: boolean
    otp_verification: boolean
    payment_gateway: boolean
    email_notifications: boolean
    sms_notifications: boolean
    analytics_dashboard: boolean
    multi_language: boolean
    dark_mode: boolean
  }
  limits: {
    max_file_size: number
    max_contract_amount: number
    min_contract_amount: number
    otp_expiry_minutes: number
    session_timeout_minutes: number
    max_login_attempts: number
  }
  defaults: {
    currency: string
    language: string
    timezone: string
    date_format: string
    deposit_percentage: number
  }
  integrations: {
    supabase: {
      url: string
      anon_key: string
      service_role_key?: string
    }
    resend?: {
      api_key: string
      from_email: string
    }
    stripe?: {
      public_key: string
      secret_key: string
    }
    google_analytics?: {
      tracking_id: string
    }
  }
}

// ==================== Export All Types ====================

export type StepData = 
  | Step1Data 
  | Step2Data 
  | Step3Data 
  | Step4Data 
  | Step5Data 
  | Step6Data 
  | Step7Data 
  | Step8Data

export interface ContractWizardState {
  currentStep: StepNumber
  contract: Partial<Contract>
  stepData: Partial<Record<`step_${StepNumber}`, StepData>>
  isLoading: boolean
  isSaving: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  isDirty: boolean
  canNavigateNext: boolean
  canNavigatePrevious: boolean
}
