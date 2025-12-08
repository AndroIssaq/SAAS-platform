'use server'

import * as crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { withAdminClient } from '@/lib/supabase/admin'

interface ActivationTokenResult {
  success: boolean
  token?: string
  error?: string
}

interface ValidateTokenResult {
  success: boolean
  userId?: string
  error?: string
}

/**
 * Helper: Generate a secure random token and its SHA-256 hash
 */
function generateTokenAndHash() {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  return { rawToken, tokenHash }
}

/**
 * Create an activation token for a given user (24h expiry)
 * Stores only the hash in user_activation_tokens
 */
export async function createUserActivationToken(userId: string): Promise<ActivationTokenResult> {
  try {
    const { rawToken, tokenHash } = generateTokenAndHash()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await withAdminClient(async (admin) => {
      const { error } = await admin.from('user_activation_tokens').insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })

      if (error) {
        throw error
      }
    })

    return { success: true, token: rawToken }
  } catch (error: any) {
    console.error('createUserActivationToken error:', error)
    return { success: false, error: 'فشل إنشاء رابط التفعيل. حاول مرة أخرى لاحقاً.' }
  }
}

/**
 * Validate a raw activation token and return the associated user_id if valid
 */
export async function validateActivationToken(rawToken: string): Promise<ValidateTokenResult> {
  try {
    if (!rawToken) {
      return { success: false, error: 'رمز التفعيل غير صالح' }
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_activation_tokens')
      .select('user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (error) {
      console.error('validateActivationToken query error:', error)
      return { success: false, error: 'فشل في التحقق من رمز التفعيل' }
    }

    if (!data) {
      return { success: false, error: 'رمز التفعيل غير صالح' }
    }

    if (data.used_at) {
      return { success: false, error: 'تم استخدام رابط التفعيل مسبقاً' }
    }

    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    if (expiresAt <= now) {
      return { success: false, error: 'انتهت صلاحية رابط التفعيل' }
    }

    return { success: true, userId: data.user_id }
  } catch (error: any) {
    console.error('validateActivationToken error:', error)
    return { success: false, error: 'حدث خطأ أثناء التحقق من رمز التفعيل' }
  }
}

/**
 * Complete user activation by setting a password and marking the token as used
 * - Updates Supabase Auth password via service role
 * - Marks public.users.status = 'active'
 * - Marks user_activation_tokens.used_at
 */
export async function completeUserActivation(rawToken: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!password || password.length < 6) {
      return { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }
    }

    const validation = await validateActivationToken(rawToken)
    if (!validation.success || !validation.userId) {
      return { success: false, error: validation.error || 'رمز التفعيل غير صالح' }
    }

    const userId = validation.userId

    // 1) Update password in Auth using admin client (service role)
    await withAdminClient(async (admin) => {
      const { error: authError } = await admin.auth.admin.updateUserById(userId, {
        password,
      })

      if (authError) {
        throw authError
      }
    })

    // 2) Mark user as active in public.users
    const supabase = await createClient()
    const { error: userError } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', userId)

    if (userError) {
      console.error('completeUserActivation user update error:', userError)
      return { success: false, error: 'تم تعيين كلمة المرور، لكن فشل تحديث حالة الحساب. يرجى التواصل مع الدعم.' }
    }

    // 3) Mark token as used
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    const { error: tokenError } = await supabase
      .from('user_activation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)

    if (tokenError) {
      console.error('completeUserActivation token update error:', tokenError)
    }

    return { success: true }
  } catch (error: any) {
    console.error('completeUserActivation error:', error)
    return { success: false, error: 'حدث خطأ أثناء تفعيل الحساب' }
  }
}
