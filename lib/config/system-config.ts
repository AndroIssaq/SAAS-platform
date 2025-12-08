/**
 * System Configuration - Enterprise Level
 * إعدادات النظام على مستوى المؤسسات
 */

import { SystemConfiguration } from '@/lib/types/contract-system'

// ==================== Environment Variables ====================

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof window !== 'undefined') {
    return process.env[`NEXT_PUBLIC_${key}`] || defaultValue
  }
  return process.env[key] || defaultValue
}

// ==================== System Configuration ====================

export const SYSTEM_CONFIG: SystemConfiguration = {
  // Features
  features: {
    realtime_sync: true,
    otp_verification: true,
    payment_gateway: true,
    email_notifications: true,
    sms_notifications: false,
    analytics_dashboard: true,
    multi_language: true,
    dark_mode: true
  },

  // Limits
  limits: {
    max_file_size: 10 * 1024 * 1024, // 10MB
    max_contract_amount: 1000000,
    min_contract_amount: 100,
    otp_expiry_minutes: 10,
    session_timeout_minutes: 60,
    max_login_attempts: 5
  },

  // Defaults
  defaults: {
    currency: 'SAR',
    language: 'ar',
    timezone: 'Asia/Riyadh',
    date_format: 'DD/MM/YYYY',
    deposit_percentage: 50
  },

  // Integrations
  integrations: {
    supabase: {
      url: getEnvVar('SUPABASE_URL'),
      anon_key: getEnvVar('SUPABASE_ANON_KEY'),
      service_role_key: getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
    },
    resend: {
      api_key: getEnvVar('RESEND_API_KEY'),
      from_email: getEnvVar('RESEND_FROM_EMAIL', 'noreply@roboweb.sa')
    },
    stripe: {
      public_key: getEnvVar('STRIPE_PUBLIC_KEY'),
      secret_key: getEnvVar('STRIPE_SECRET_KEY')
    },
    google_analytics: {
      tracking_id: getEnvVar('GA_TRACKING_ID')
    }
  }
}

// ==================== Step Configuration ====================

export interface StepConfig {
  id: number
  name: string
  nameEn: string
  icon: string
  requiredRole?: string[]
  canSkip?: boolean
  requiresPreviousStep?: boolean
  validationRules?: string[]
}

export const STEPS_CONFIG: StepConfig[] = [
  {
    id: 1,
    name: 'بيانات العقد',
    nameEn: 'Contract Details',
    icon: 'FileText',
    requiresPreviousStep: false
  },
  {
    id: 2,
    name: 'مراجعة البيانات',
    nameEn: 'Review Details',
    icon: 'Eye',
    requiresPreviousStep: true
  },
  {
    id: 3,
    name: 'التوقيعات',
    nameEn: 'Signatures',
    icon: 'PenTool',
    requiresPreviousStep: true
  },
  {
    id: 4,
    name: 'بطاقات الهوية',
    nameEn: 'ID Cards',
    icon: 'CreditCard',
    requiresPreviousStep: true
  },
  {
    id: 5,
    name: 'التحقق بـ OTP',
    nameEn: 'OTP Verification',
    icon: 'Shield',
    requiresPreviousStep: true
  },
  {
    id: 6,
    name: 'إثبات الدفع',
    nameEn: 'Payment Proof',
    icon: 'DollarSign',
    requiresPreviousStep: true,
    requiredRole: ['client']
  },
  {
    id: 7,
    name: 'المراجعة النهائية',
    nameEn: 'Final Review',
    icon: 'CheckCircle',
    requiresPreviousStep: true,
    requiredRole: ['admin']
  },
  {
    id: 8,
    name: 'إتمام العقد',
    nameEn: 'Complete Contract',
    icon: 'Award',
    requiresPreviousStep: true
  }
]

// ==================== Service Categories ====================

export const SERVICE_CATEGORIES = {
  'web-development': {
    name: 'تطوير المواقع',
    nameEn: 'Web Development',
    icon: 'Globe',
    color: '#667eea'
  },
  'mobile-app': {
    name: 'تطبيقات الجوال',
    nameEn: 'Mobile Apps',
    icon: 'Smartphone',
    color: '#f59e0b'
  },
  'design': {
    name: 'التصميم',
    nameEn: 'Design',
    icon: 'Palette',
    color: '#ec4899'
  },
  'marketing': {
    name: 'التسويق الرقمي',
    nameEn: 'Digital Marketing',
    icon: 'TrendingUp',
    color: '#10b981'
  },
  'consulting': {
    name: 'الاستشارات',
    nameEn: 'Consulting',
    icon: 'MessageSquare',
    color: '#6366f1'
  },
  'ecommerce': {
    name: 'التجارة الإلكترونية',
    nameEn: 'E-commerce',
    icon: 'ShoppingCart',
    color: '#f97316'
  },
  'cms': {
    name: 'أنظمة إدارة المحتوى',
    nameEn: 'CMS',
    icon: 'Database',
    color: '#8b5cf6'
  },
  'ai-ml': {
    name: 'الذكاء الاصطناعي',
    nameEn: 'AI & ML',
    icon: 'Cpu',
    color: '#0ea5e9'
  },
  'blockchain': {
    name: 'البلوك تشين',
    nameEn: 'Blockchain',
    icon: 'Link',
    color: '#14b8a6'
  },
  'cloud': {
    name: 'الحوسبة السحابية',
    nameEn: 'Cloud Computing',
    icon: 'Cloud',
    color: '#64748b'
  },
  'security': {
    name: 'الأمن السيبراني',
    nameEn: 'Cybersecurity',
    icon: 'Shield',
    color: '#ef4444'
  },
  'other': {
    name: 'أخرى',
    nameEn: 'Other',
    icon: 'MoreHorizontal',
    color: '#94a3b8'
  }
}

// ==================== Payment Methods ====================

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'تحويل بنكي', icon: 'Building' },
  { value: 'credit_card', label: 'بطاقة ائتمان', icon: 'CreditCard' },
  { value: 'paypal', label: 'باي بال', icon: 'CreditCard' },
  { value: 'stc_pay', label: 'STC Pay', icon: 'Smartphone' },
  { value: 'apple_pay', label: 'Apple Pay', icon: 'Smartphone' },
  { value: 'cash', label: 'نقدي', icon: 'Banknote' }
]

// ==================== Contract Status ====================

export const CONTRACT_STATUS_CONFIG = {
  draft: { label: 'مسودة', color: 'gray', icon: 'Edit' },
  pending: { label: 'قيد الانتظار', color: 'yellow', icon: 'Clock' },
  signed: { label: 'موقّع', color: 'blue', icon: 'PenTool' },
  active: { label: 'نشط', color: 'green', icon: 'Activity' },
  completed: { label: 'مكتمل', color: 'purple', icon: 'CheckCircle' },
  cancelled: { label: 'ملغي', color: 'red', icon: 'XCircle' }
}

// ==================== Validation Rules ====================

export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+966|0)?5\d{8}$/,
  saudiId: /^[1-2]\d{9}$/,
  contractNumber: /^RW-\d+-\d+$/,
  otp: /^\d{6}$/,
  amount: /^\d+(\.\d{1,2})?$/
}

// ==================== API Endpoints ====================

export const API_ENDPOINTS = {
  contracts: '/api/contracts',
  services: '/api/services',
  notifications: '/api/notifications',
  analytics: '/api/analytics',
  auth: '/api/auth',
  upload: '/api/upload',
  export: '/api/export'
}

// ==================== Error Messages ====================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
  VALIDATION_ERROR: 'يرجى التحقق من البيانات المدخلة.',
  AUTH_ERROR: 'غير مصرح لك بالوصول لهذه الصفحة.',
  NOT_FOUND: 'لم يتم العثور على المحتوى المطلوب.',
  SERVER_ERROR: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
  SESSION_EXPIRED: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.',
  FILE_TOO_LARGE: 'حجم الملف كبير جداً.',
  INVALID_FILE_TYPE: 'نوع الملف غير مدعوم.',
  OTP_EXPIRED: 'انتهت صلاحية رمز التحقق.',
  OTP_INVALID: 'رمز التحقق غير صحيح.',
  CONTRACT_LOCKED: 'هذا العقد محمي ولا يمكن تعديله.',
  INSUFFICIENT_PERMISSIONS: 'ليس لديك الصلاحيات الكافية.'
}

// ==================== Success Messages ====================

export const SUCCESS_MESSAGES = {
  CONTRACT_CREATED: 'تم إنشاء العقد بنجاح.',
  CONTRACT_UPDATED: 'تم تحديث العقد بنجاح.',
  CONTRACT_DELETED: 'تم حذف العقد بنجاح.',
  SIGNATURE_ADDED: 'تم إضافة التوقيع بنجاح.',
  DOCUMENT_UPLOADED: 'تم رفع المستند بنجاح.',
  PAYMENT_COMPLETED: 'تم إتمام عملية الدفع بنجاح.',
  OTP_SENT: 'تم إرسال رمز التحقق.',
  OTP_VERIFIED: 'تم التحقق بنجاح.',
  EMAIL_SENT: 'تم إرسال البريد الإلكتروني.',
  DATA_SAVED: 'تم حفظ البيانات بنجاح.',
  STEP_COMPLETED: 'تم إكمال الخطوة بنجاح.'
}

// ==================== Export Utilities ====================

export const getStepConfig = (step: number): StepConfig | undefined => {
  return STEPS_CONFIG.find(s => s.id === step)
}

export const getServiceCategoryConfig = (category: string) => {
  return SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES]
}

export const getPaymentMethodConfig = (method: string) => {
  return PAYMENT_METHODS.find(m => m.value === method)
}

export const getContractStatusConfig = (status: string) => {
  return CONTRACT_STATUS_CONFIG[status as keyof typeof CONTRACT_STATUS_CONFIG]
}

export const validateField = (field: string, value: string, rule: keyof typeof VALIDATION_RULES): boolean => {
  const regex = VALIDATION_RULES[rule]
  return regex.test(value)
}

export const formatCurrency = (amount: number, currency: string = SYSTEM_CONFIG.defaults.currency): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatDate = (date: Date | string, format?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  return dateObj.toLocaleDateString('ar-SA', options)
}
