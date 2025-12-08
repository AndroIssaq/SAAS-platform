export interface Service {
  id: string
  name: string
  name_en?: string
  category: ServiceCategory
  description?: string
  description_en?: string
  
  // Pricing
  base_price: number
  currency: string
  price_type: PriceType
  
  // Package Details
  features: string[]
  deliverables: string[]
  timeline?: string
  timeline_days?: number
  
  // Additional Details
  requirements?: string[]
  terms?: string[]
  payment_schedule?: PaymentScheduleItem[]
  
  // Customization Options
  has_packages: boolean
  packages?: ServicePackage[]
  add_ons?: ServiceAddOn[]
  
  // Status & Visibility
  is_active: boolean
  is_featured: boolean
  display_order: number
  
  // Metadata
  created_by?: string
  created_at: string
  updated_at: string
  
  // Search & SEO
  tags?: string[]
  meta_title?: string
  meta_description?: string
  
  // Images & Media
  thumbnail_url?: string
  gallery_urls?: string[]
  
  // Statistics
  total_contracts: number
  total_revenue: number
}

export type ServiceCategory = 
  | 'web-development'
  | 'mobile-app'
  | 'design'
  | 'marketing'
  | 'consulting'
  | 'custom'

export type PriceType = 
  | 'fixed'
  | 'hourly'
  | 'monthly'
  | 'custom'

export interface ServicePackage {
  id: string
  name: string
  name_en?: string
  description?: string
  price: number
  features: string[]
  is_popular?: boolean
}

export interface ServiceAddOn {
  id: string
  name: string
  name_en?: string
  description?: string
  price: number
  is_required?: boolean
}

export interface PaymentScheduleItem {
  id: string
  name: string
  percentage: number
  amount?: number
  due_date?: string
  description?: string
}

export interface CreateServiceInput {
  name: string
  name_en?: string
  category: ServiceCategory
  description?: string
  description_en?: string
  base_price: number
  currency?: string
  price_type?: PriceType
  features?: string[]
  deliverables?: string[]
  timeline?: string
  timeline_days?: number
  requirements?: string[]
  terms?: string[]
  payment_schedule?: PaymentScheduleItem[]
  has_packages?: boolean
  packages?: ServicePackage[]
  add_ons?: ServiceAddOn[]
  is_active?: boolean
  is_featured?: boolean
  display_order?: number
  tags?: string[]
  meta_title?: string
  meta_description?: string
  thumbnail_url?: string
  gallery_urls?: string[]
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  id: string
}

export const SERVICE_CATEGORIES: { value: ServiceCategory; label: string; label_en: string }[] = [
  { value: 'web-development', label: 'تطوير المواقع', label_en: 'Web Development' },
  { value: 'mobile-app', label: 'تطبيقات الموبايل', label_en: 'Mobile Apps' },
  { value: 'design', label: 'التصميم', label_en: 'Design' },
  { value: 'marketing', label: 'التسويق', label_en: 'Marketing' },
  { value: 'consulting', label: 'الاستشارات', label_en: 'Consulting' },
  { value: 'custom', label: 'خدمة مخصصة', label_en: 'Custom Service' },
]

export const PRICE_TYPES: { value: PriceType; label: string; label_en: string }[] = [
  { value: 'fixed', label: 'سعر ثابت', label_en: 'Fixed Price' },
  { value: 'hourly', label: 'بالساعة', label_en: 'Hourly Rate' },
  { value: 'monthly', label: 'شهري', label_en: 'Monthly' },
  { value: 'custom', label: 'مخصص', label_en: 'Custom' },
]
