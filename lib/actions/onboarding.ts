'use server'

import { createClient } from '@/lib/supabase/server'
import { withAdminClient } from '@/lib/supabase/admin'

import { requireActiveSubscription } from '@/lib/actions/subscription-guard'

export async function saveOnboardingData(data: any) {
  await requireActiveSubscription() // Security Check

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح' }
  }

  const { error } = await supabase
    .from('clients')
    .update({
      onboarding_completed: true,
      onboarding_data: data
    })
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getCurrentClient(userId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const targetUserId = userId || user?.id

  if (!targetUserId) {
    console.log('[getCurrentClient] No targetUserId found')
    return { success: false, error: 'غير مصرح', data: null }
  }

  console.log('[getCurrentClient] Looking for client with user_id:', targetUserId)
  console.log('[getCurrentClient] Current user email:', user?.email)

  // Get current account ID for security check
  let accountId: string | null = null
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', targetUserId)
      .single()
    accountId = userData?.account_id || null
  } catch (error) {
    console.error('[getCurrentClient] Error getting account ID:', error)
  }
  console.log('[getCurrentClient] Current account ID:', accountId)

  // Use admin client to bypass RLS for now until we fix the policies
  return await withAdminClient(async (admin) => {
    // أولاً: حاول العثور على العميل المرتبط مباشرة بـ user_id
    let query = admin
      .from('clients')
      .select('*')
      .eq('user_id', targetUserId)

    // If we have an account context, filter by account_id for security
    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data, error } = await query.maybeSingle()

    console.log('[getCurrentClient] Query by user_id result:', { data, error })

    if (error) {
      console.error('[getCurrentClient] query by user_id failed:', error)
      return { success: false, error: error.message, data: null }
    }

    if (data) {
      console.log('[getCurrentClient] Found client by user_id:', data.id)
      return { success: true, data }
    }

    console.log('[getCurrentClient] No client found by user_id, trying email...')

    // لو مفيش صف مربوط بـ user_id، جرّب تربط العميل عن طريق الإيميل
    // هذا يغطي حالة العقود التي أنشأها الأدمن لعميل "مدعو" قبل ما يعمل حساب فعلي
    if (user?.email) {
      console.log('[getCurrentClient] Searching by email:', user.email)
      let emailQuery = admin
        .from('clients')
        .select('*')
        .filter('onboarding_data->>email', 'eq', user.email)

      // If we have an account context, filter by account_id for security
      if (accountId) {
        emailQuery = emailQuery.eq('account_id', accountId)
      }

      const { data: clientByEmail, error: emailError } = await emailQuery.maybeSingle()

      console.log('[getCurrentClient] Email search result:', { clientByEmail, emailError })

      if (emailError) {
        console.error('[getCurrentClient] query by email failed:', emailError)
        return { success: false, error: emailError.message, data: null }
      }

      if (clientByEmail) {
        console.log('[getCurrentClient] Found client by email:', clientByEmail.id)
        // اختيارياً: اربط هذا العميل بالمستخدم الحالي حتى تصبح العلاقة ثابتة مستقبلاً
        const { data: updatedClient, error: linkError } = await admin
          .from('clients')
          .update({ user_id: targetUserId })
          .eq('id', clientByEmail.id)
          .select('*')
          .single()

        if (linkError) {
          console.error('[getCurrentClient] linking client to user failed:', linkError)
          return { success: false, error: linkError.message, data: null }
        }

        console.log('[getCurrentClient] Linked existing client by email to user_id:', targetUserId)
        return { success: true, data: updatedClient || clientByEmail }
      }
    }

    console.log('[getCurrentClient] No client found by email either')

    return { success: false, error: 'لم يتم العثور على ملف عميل مرتبط بالمستخدم', data: null }
  })
}
