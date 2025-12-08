import { z } from "zod"

export const contractFormSchema = z.object({
    // Client Information
    client_name: z.string().min(2, "اسم العميل مطلوب"),
    client_email: z.string().email("البريد الإلكتروني غير صحيح"),
    client_phone: z.string().min(8, "رقم الجوال مطلوب"),
    company_name: z.string().optional(),

    // Service Selection
    use_custom_service: z.boolean().default(false),
    service_id: z.string().optional(),

    // Service Details (for custom or override)
    service_type: z.string().min(2, "نوع الخدمة مطلوب"),
    package_name: z.string().min(2, "اسم الباقة مطلوب"),
    service_description: z.string().optional(),

    // Pricing & Timeline
    total_amount: z.coerce.number().min(1, "المبلغ الإجمالي مطلوب"),
    deposit_percentage: z.coerce.number().min(0).max(100).default(50),
    payment_method: z.string().min(1, "طريقة الدفع مطلوبة"),
    timeline: z.string().optional(),

    // Features & Deliverables
    features: z.array(z.string()).default([]),
    deliverables: z.array(z.string()).default([]),

    // Notes
    notes: z.string().optional(),
    terms_notes: z.string().optional(),

    // System Fields
    contract_number: z.string().optional(),
})

export type ContractFormValues = z.infer<typeof contractFormSchema>
