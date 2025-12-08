'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentAccount } from '@/lib/actions/account'

const ALLOWED_PLANS = ['free', 'small_office_monthly', 'company_monthly', 'enterprise'] as const
export type BillingPlanId = (typeof ALLOWED_PLANS)[number]

export async function getAvailablePlans() {
  const plans: { id: BillingPlanId; name: string; description: string }[] = [
    {
      id: 'free',
      name: 'الخطة المجانية',
      description: 'مناسبة للتجربة والاستخدام المحدود قبل الاشتراك في خطة مدفوعة.',
    },
    {
      id: 'small_office_monthly',
      name: 'خطة المكاتب الصغيرة (شهري)',
      description: 'للمكاتب الفردية والشركات الصغيرة التي تحتاج لإدارة العقود بشكل احترافي.',
    },
    {
      id: 'company_monthly',
      name: 'خطة الشركات الكبيرة (شهري)',
      description: 'للشركات التي تتعامل مع حجم عقود ومشاريع أكبر بشكل مستمر.',
    },
    {
      id: 'enterprise',
      name: 'خطة Enterprise',
      description: 'تسعير مخصص وربط عميق مع أنظمة الشركة الداخلية.',
    },
  ]

  return plans
}

export async function getAccountBillingInfo() {
  const accountResult = await getCurrentAccount()

  if (!accountResult.success || !accountResult.accountId) {
    return {
      success: false,
      error: 'لم يتم العثور على حساب حالي للمستخدم.',
      planCode: 'free' as BillingPlanId,
      planLabel: 'الخطة المجانية / غير محددة',
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('accounts')
    .select('plan, status')
    .eq('id', accountResult.accountId)
    .single()

  if (error) {
    return {
      success: false,
      error: error.message,
      planCode: 'free' as BillingPlanId,
      planLabel: 'الخطة المجانية / غير محددة',
    }
  }

  const planCode = (data?.plan as BillingPlanId | null) || 'free'

  let planLabel: string
  if (planCode === 'small_office_monthly') {
    planLabel = 'خطة المكاتب الصغيرة (شهري)'
  } else if (planCode === 'company_monthly') {
    planLabel = 'خطة الشركات الكبيرة (شهري)'
  } else if (planCode === 'enterprise') {
    planLabel = 'خطة Enterprise مخصصة'
  } else {
    planLabel = 'الخطة المجانية / غير محددة'
  }

  return {
    success: true,
    planCode,
    planLabel,
    status: data?.status as string | null,
  }
}

export async function updateAccountPlan(formData: FormData): Promise<void> {
  const rawPlan = formData.get('plan')
  const newPlan = (typeof rawPlan === 'string' ? rawPlan : 'free') as BillingPlanId

  if (!ALLOWED_PLANS.includes(newPlan)) {
    console.error('updateAccountPlan: invalid plan', newPlan)
    return
  }

  const accountResult = await getCurrentAccount()

  if (!accountResult.success || !accountResult.accountId) {
    console.error('updateAccountPlan: no current account for user')
    return
  }

  if (accountResult.role && accountResult.role !== 'owner') {
    console.error('updateAccountPlan: user is not account owner')
    return
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('accounts')
    .update({ plan: newPlan })
    .eq('id', accountResult.accountId)

  if (error) {
    console.error('updateAccountPlan: failed to update account plan', error)
  }
}

export async function getBillingPortalUrlPlaceholder() {
  return {
    success: false,
    url: null as string | null,
    error: 'لم يتم تفعيل بوابة الدفع والاشتراكات بعد. يمكن ربط Stripe أو مزود دفع لاحقًا.',
  }
}
