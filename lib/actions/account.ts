'use server'

import { createClient } from '@/lib/supabase/server'
import { withAdminClient } from '@/lib/supabase/admin'

interface EnsureUserAccountResult {
  success: boolean
  userId?: string
  accountId?: string
  error?: string
}

interface CurrentAccountResult {
  success: boolean
  accountId?: string
  role?: string
  error?: string
}

/**
 * Ensure that the current authenticated user has:
 * - a row in public.users
 * - an account in public.accounts
 * - a membership row in public.account_members as owner
 *
 * This function is idempotent: يمكن استدعاؤها أكثر من مرة بدون مشاكل.
 */
export async function ensureUserAccount(): Promise<EnsureUserAccountResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('ensureUserAccount auth error:', authError)
    return { success: false, error: 'Authentication error' }
  }

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const userId = user.id
  const email = user.email ?? ''
  const fullName = (user.user_metadata?.full_name as string | undefined) || email.split('@')[0] || 'مستخدم جديد'
  const role = (user.user_metadata?.role as string | undefined) || 'owner'
  const billingPlanMeta = (user.user_metadata?.billing_plan as string | undefined) || 'free'
  const allowedPlans = ['free', 'small_office_monthly', 'company_monthly', 'enterprise']
  const initialPlan = allowedPlans.includes(billingPlanMeta) ? billingPlanMeta : 'free'

  try {
    const result = await withAdminClient(async (admin) => {
      // 1) تأكد من وجود صف في public.users - استخدم upsert لتجنب أخطاء التكرار
      const { data: existingUsers, error: fetchUserError } = await admin
        .from('users')
        .select('id, email')
        .or(`id.eq.${userId},email.eq.${email}`)
        .limit(1)

      if (fetchUserError) {
        console.error('Error fetching users:', fetchUserError)
        // Continue anyway - user might exist
      }

      // If user doesn't exist by id or email, create them
      if (!existingUsers || existingUsers.length === 0) {
        const { error: insertUserError } = await admin.from('users').upsert({
          id: userId,
          email,
          full_name: fullName,
          role,
          status: 'active',
        }, { onConflict: 'id' })

        if (insertUserError) {
          // If still duplicate email error, try to update existing user by email
          if (insertUserError.code === '23505') {
            console.log('User with this email exists, updating...')
            const { error: updateError } = await admin
              .from('users')
              .update({ id: userId, full_name: fullName, role, status: 'active' })
              .eq('email', email)

            if (updateError) {
              console.error('Error updating user by email:', updateError)
              // Don't throw - continue to check memberships
            }
          } else {
            console.error('Error inserting user:', insertUserError)
            // Don't throw - the user might already exist
          }
        }
      }

      // 2) ابحث عن عضوية موجودة للمستخدم في أي حساب
      const { data: memberships, error: membershipsError } = await admin
        .from('account_members')
        .select('id, account_id, role')
        .eq('user_id', userId)
        .limit(1)

      if (membershipsError) {
        throw membershipsError
      }

      if (memberships && memberships.length > 0) {
        // المستخدم لديه حساب بالفعل
        const membership = memberships[0]
        return { accountId: membership.account_id as string }
      }

      // 3) لا يوجد حساب للمستخدم → أنشئ حساب جديد + عضوية مالك
      const baseSlug = (email.split('@')[0] || fullName || 'account')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 32)

      const slug = `${baseSlug || 'account'}-${Math.random().toString(36).substring(2, 6)}`

      // Create account with trial_started_at for new accounts
      const { data: accountInsertData, error: accountInsertError } = await admin
        .from('accounts')
        .insert({
          owner_user_id: userId,
          name: fullName || 'الحساب الرئيسي',
          slug,
          plan: initialPlan,
          status: 'active',
          trial_started_at: new Date().toISOString(), // Start trial immediately
          subscription_status: 'trial', // Set initial status as trial
        })
        .select('id')
        .single()

      if (accountInsertError || !accountInsertData) {
        throw accountInsertError || new Error('Failed to create account')
      }

      const accountId = accountInsertData.id as string

      const { error: memberInsertError } = await admin.from('account_members').insert({
        account_id: accountId,
        user_id: userId,
        role: 'owner',
      })

      if (memberInsertError) {
        throw memberInsertError
      }

      return { accountId }
    })

    return {
      success: true,
      userId,
      accountId: result.accountId,
    }
  } catch (error) {
    console.error('ensureUserAccount error:', error)
    return { success: false, error: 'Failed to initialize account' }
  }
}

/**
 * Get the current account for the authenticated user using RLS.
 * يفترض أن ensureUserAccount تم استدعاؤها على الأقل مرة واحدة من قبل.
 */
export async function getCurrentAccount(): Promise<CurrentAccountResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('getCurrentAccount auth error:', authError)
    return { success: false, error: 'Authentication error' }
  }

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // استخدم صلاحيات الـ admin لقراءة عضوية الحساب بدون الاعتماد على RLS
  let membership: { account_id: string; role?: string } | null = null

  try {
    membership = await withAdminClient(async (admin) => {
      const { data, error } = await admin
        .from('account_members')
        .select('account_id, role')
        .eq('user_id', user.id)
        .limit(1)

      if (error) {
        throw error
      }

      return data && data.length > 0 ? (data[0] as { account_id: string; role?: string }) : null
    })
  } catch (error) {
    console.error('getCurrentAccount admin query error:', error)
    return { success: false, error: 'Failed to fetch current account' }
  }

  if (!membership?.account_id) {
    return { success: false, error: 'No account found for user' }
  }

  return {
    success: true,
    accountId: membership.account_id as string,
    role: membership.role as string | undefined,
  }
}


export async function getCurrentAccountId(): Promise<string | null> {
  const result = await getCurrentAccount()
  if (!result.success || !result.accountId) return null
  return result.accountId
}

export async function getProfileData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Fetch Public User Data
  const { data: userData } = await supabase
    .from('users')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  // Fetch Account Data (Company Name)
  const accountId = await getCurrentAccountId()
  let accountData = null

  if (accountId) {
    // using admin client to bypass potential RLS restricted reads on account name if strictly scoped
    const result = await withAdminClient(async (admin) => {
      return await admin
        .from('accounts')
        .select('name')
        .eq('id', accountId)
        .single()
    })
    accountData = result.data
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: userData?.email || user.email,
      full_name: userData?.full_name || '',
      role: userData?.role || 'user',
    },
    company_name: accountData?.name || ''
  }
}

export async function updateProfileData({
  fullName,
  companyName
}: {
  fullName: string
  companyName: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const accountId = await getCurrentAccountId()

  if (!user || !accountId) {
    return { success: false, error: "Unauthorized or No Account" }
  }

  // 1. Update User Full Name
  const { error: userError } = await withAdminClient(async (admin) => {
    return await admin
      .from('users')
      .update({ full_name: fullName })
      .eq('id', user.id)
  })

  if (userError) {
    console.error("Error updating user:", userError)
    return { success: false, error: "فشل في تحديث بيانات المستخدم" }
  }

  // 2. Update Account Name (Company Name)
  const { error: accountError } = await withAdminClient(async (admin) => {
    return await admin
      .from('accounts')
      .update({ name: companyName })
      .eq('id', accountId)
  })

  if (accountError) {
    console.error("Error updating account:", accountError)
    return { success: false, error: "فشل في تحديث اسم الشركة" }
  }

  return { success: true }
}
