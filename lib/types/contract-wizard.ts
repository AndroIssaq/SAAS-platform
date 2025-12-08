/**
 * Contract Wizard Types - 8 Steps System
 * نظام الخطوات الثمانية لإنشاء العقد
 */

export type ContractStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface StepInfo {
  id: ContractStep
  title: string
  description: string
  icon: string
  requiredFields: string[]
  canSkip: boolean
}

export const CONTRACT_STEPS: StepInfo[] = [
  {
    id: 1,
    title: "بيانات العقد",
    description: "معلومات العميل والخدمة المطلوبة",
    icon: "FileText",
    requiredFields: ["client_name", "client_email", "client_phone", "service_type", "total_amount"],
    canSkip: false,
  },
  {
    id: 2,
    title: "مراجعة العقد",
    description: "التحقق من صحة جميع البيانات",
    icon: "Eye",
    requiredFields: [],
    canSkip: false,
  },
  {
    id: 3,
    title: "التوقيع الإلكتروني",
    description: "توقيع الطرفين على العقد",
    icon: "PenTool",
    requiredFields: ["admin_signature", "client_signature"],
    canSkip: false,
  },
  {
    id: 4,
    title: "بطاقات الهوية",
    description: "رفع صور بطاقات الهوية",
    icon: "CreditCard",
    requiredFields: ["admin_id_card", "client_id_card"],
    canSkip: false,
  },
  {
    id: 5,
    title: "إثبات العقد الأمني",
    description: "التحقق عبر OTP",
    icon: "Shield",
    requiredFields: ["otp_verified"],
    canSkip: false,
  },
  {
    id: 6,
    title: "إثبات الدفع",
    description: "رفع صورة إثبات التحويل",
    icon: "DollarSign",
    requiredFields: ["payment_proof"],
    canSkip: false,
  },
  {
    id: 7,
    title: "قبول المدير",
    description: "انتظار موافقة الإدارة",
    icon: "UserCheck",
    requiredFields: ["admin_approved"],
    canSkip: false,
  },
  {
    id: 8,
    title: "مراجعة نهائية",
    description: "العقد جاهز للطباعة",
    icon: "CheckCircle",
    requiredFields: [],
    canSkip: false,
  },
]

export interface ContractProgress {
  contract_id: string
  current_step: ContractStep
  step_1_completed: boolean
  step_2_completed: boolean
  step_3_completed: boolean
  step_4_completed: boolean
  step_5_completed: boolean
  step_6_completed: boolean
  step_7_completed: boolean
  step_8_completed: boolean
  step_1_data?: Record<string, any>
  step_2_data?: Record<string, any>
  step_3_data?: {
    admin_signature_url?: string
    client_signature_url?: string
    admin_signed_at?: string
    client_signed_at?: string
  }
  step_4_data?: {
    admin_id_card_url?: string
    client_id_card_url?: string
  }
  step_5_data?: {
    otp_verified_at?: string
    otp_phone?: string
    otp_code?: string
    email?: string
    verified_at?: string
  }
  step_6_data?: Record<string, any>
  step_7_data?: Record<string, any>
  step_8_data?: Record<string, any>
  progress_updated_at: string
  
  // Direct signature and ID card fields for real-time sync
  admin_signature?: string
  client_signature?: string
  admin_signed_at?: string
  client_signed_at?: string
  admin_id_card?: string
  client_id_card?: string
}

export interface StepValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface WizardState {
  contractId: string | null
  currentStep: ContractStep
  progress: ContractProgress | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

// Step 1: Contract Details - متوافق مع جداول Supabase
export interface Step1Data {
  // بيانات العميل - Client Information (contracts table)
  client_name: string
  client_email: string
  client_phone: string
  company_name?: string
  
  // معلومات الخدمة - Service Information
  service_id?: string // UUID من جدول services
  service_type: string // category من services
  service_name: string // name من services
  service_description?: string
  
  // المعلومات المالية - Financial Information (contracts table)
  total_amount: number
  deposit_amount: number
  remaining_amount?: number // محسوب تلقائياً
  payment_method: string
  
  // تفاصيل إضافية - Additional Details (contracts table)
  timeline?: string
  notes?: string
  
  // رقم العقد - Contract Number (contracts table)
  contract_number?: string // سيتم توليده تلقائياً
  
  // بيانات إضافية
  deliverables?: string[] // سيتم حفظها في deliverables column
  contract_terms?: {
    terms: string[]
    notes?: string
  }
}

// Step 3: Signatures
export interface Step3Data {
  admin_signature: string // base64 or URL
  client_signature: string
  admin_signed_at: string
  client_signed_at: string
}

// Step 4: ID Cards
export interface Step4Data {
  admin_id_card: File | string
  client_id_card: File | string
}

// Step 5: OTP
export interface Step5Data {
  otp_code: string
  phone_number?: string
  email?: string
  verified_at?: string
}

// Step 6: Payment Proof
export interface Step6Data {
  payment_method: string
  amount: number
  transaction_reference?: string
  proof_image: File | string
}

// Helper Types
export type StepData = 
  | Step1Data
  | Step3Data
  | Step4Data
  | Step5Data
  | Step6Data
  | Record<string, any>

export interface SaveProgressInput {
  contract_id: string
  step: ContractStep
  step_data?: StepData
  completed?: boolean
}

export interface LoadProgressInput {
  contract_id: string
}
