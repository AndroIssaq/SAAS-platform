/**
 * Subscription Plans and Payment Methods Configuration
 * These are constants that can be imported by both server and client components
 */

// ==================== Types ====================

export type PlanId = 'small_office' | 'large_company' | 'enterprise'
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'
export type PaymentMethod = 'vodafone_cash' | 'instapay' | 'meeza' | 'fawry' | 'visa_mastercard' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'approved' | 'rejected'

export interface Plan {
    id: PlanId
    name: string
    nameAr: string
    priceEgp: number
    priceLabel: string
    features: string[]
    popular?: boolean
}

export interface SubscriptionStatusResult {
    status: SubscriptionStatus
    trialDaysRemaining: number
    trialEndsAt: Date | null
    isBlocked: boolean
    currentPlan: Plan | null
    subscriptionEndsAt: Date | null
}

// ==================== Plans Configuration ====================

export const PLANS: Plan[] = [
    {
        id: 'small_office',
        name: 'Small Office',
        nameAr: 'المكاتب الصغيرة',
        priceEgp: 299,
        priceLabel: '299 جنيه/شهر',
        features: [
            'إدارة حتى 50 عقد شهرياً',
            'نماذج Lead Gen غير محدودة',
            'تخزين 2 جيجا للملفات',
            'إرسال 500 بريد إلكتروني/شهر',
            'شريك واحد',
            'دعم عبر البريد الإلكتروني',
        ],
    },
    {
        id: 'large_company',
        name: 'Large Company',
        nameAr: 'الشركات الكبيرة',
        priceEgp: 699,
        priceLabel: '699 جنيه/شهر',
        popular: true,
        features: [
            'عقود غير محدودة',
            'نماذج Lead Gen غير محدودة',
            'تخزين 10 جيجا للملفات',
            'إرسال 2000 بريد إلكتروني/شهر',
            '10 شركاء',
            'تقارير وإحصائيات متقدمة',
            'دعم أولوية 24/7',
            'تصدير بيانات Excel/CSV',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        nameAr: 'حسب الاتفاق',
        priceEgp: 0, // Custom pricing
        priceLabel: 'تواصل معنا',
        features: [
            'كل مميزات الشركات الكبيرة',
            'تخزين غير محدود',
            'شركاء غير محدودين',
            'تخصيص العلامة التجارية (White-Label)',
            'مدير حساب مخصص',
            'تدريب الفريق',
            'SLA 99.9%',
            'API مخصص',
        ],
    },
]

// Payment methods configuration
export const PAYMENT_METHODS = [
    {
        id: 'vodafone_cash' as PaymentMethod,
        name: 'فودافون كاش',
        icon: '📱',
        details: 'أرسل المبلغ إلى الرقم: 01065955670',
        instructions: '1. افتح تطبيق فودافون كاش\n2. اختر "تحويل أموال"\n3. أدخل الرقم 01065955670\n4. أدخل المبلغ\n5. أكد العملية واحفظ رقم المعاملة',
    },
    {
        id: 'instapay' as PaymentMethod,
        name: 'إنستا باي',
        icon: '💳',
        details: 'حول إلى رقم الموبايل: 01065955670',
        instructions: '1. افتح تطبيق البنك أو إنستا باي\n2. اختر "تحويل"\n3. أدخل الرقم 01065955670\n4. أدخل المبلغ\n5. أكد العملية واحفظ رقم المعاملة',
    },
    {
        id: 'meeza' as PaymentMethod,
        name: 'ميزة',
        icon: '💳',
        details: 'تحويل عبر بطاقة ميزة',
        instructions: '1. افتح تطبيق البنك\n2. اختر تحويل ميزة\n3. أدخل رقم 01065955670\n4. أكد العملية',
    },
    {
        id: 'fawry' as PaymentMethod,
        name: 'فوري',
        icon: '🏪',
        details: 'ادفع في أي منفذ فوري',
        instructions: 'تواصل معنا للحصول على كود الدفع عبر فوري',
    },
    {
        id: 'bank_transfer' as PaymentMethod,
        name: 'تحويل بنكي',
        icon: '🏦',
        details: 'تحويل بنكي مباشر',
        instructions: 'تواصل معنا للحصول على بيانات الحساب البنكي',
    },
]

export const TRIAL_DAYS = 14
