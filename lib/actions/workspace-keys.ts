'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentAccountId } from '@/lib/actions/account'

interface WorkspaceKeyRecord {
  account_id: string
  public_key: string
  key_type: string
  encryption_version: string
  created_at: string
  updated_at: string
}

interface WorkspaceKeyResult {
  success: boolean
  data?: WorkspaceKeyRecord
  error?: string
}

interface SimpleResult {
  success: boolean
  error?: string
}

function nowIso() {
  return new Date().toISOString()
}

async function getCurrentUserId() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { success: false as const, error: 'Unauthorized' }
  }

  return { success: true as const, userId: user.id }
}

export async function getWorkspacePublicKey(): Promise<WorkspaceKeyResult> {
  const accountId = await getCurrentAccountId()
  if (!accountId) {
    return { success: false, error: 'لا يوجد مساحة عمل مفعّلة' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspace_keys')
    .select('account_id, public_key, key_type, encryption_version, created_at, updated_at')
    .eq('account_id', accountId)
    .maybeSingle()

  if (error) {
    console.error('getWorkspacePublicKey error:', error)
    return { success: false, error: 'فشل جلب المفتاح العام للمساحة' }
  }

  if (!data) {
    return { success: false, error: 'لم يتم إنشاء مفتاح عام للمساحة بعد' }
  }

  return { success: true, data }
}

export async function upsertWorkspacePublicKey(params: {
  publicKey: string
  keyType?: string
  encryptionVersion?: string
}): Promise<WorkspaceKeyResult> {
  const accountId = await getCurrentAccountId()
  if (!accountId) {
    return { success: false, error: 'لا يوجد مساحة عمل مفعّلة' }
  }

  if (!params.publicKey) {
    return { success: false, error: 'المفتاح العام مطلوب' }
  }

  const supabase = await createClient()
  const payload = {
    account_id: accountId,
    public_key: params.publicKey,
    key_type: params.keyType ?? 'curve25519',
    encryption_version: params.encryptionVersion ?? 'v1',
    updated_at: nowIso(),
  }

  const { data, error } = await supabase
    .from('workspace_keys')
    .upsert(payload, { onConflict: 'account_id' })
    .select('account_id, public_key, key_type, encryption_version, created_at, updated_at')
    .single()

  if (error) {
    console.error('upsertWorkspacePublicKey error:', error)
    return { success: false, error: 'تعذّر حفظ المفتاح العام للمساحة' }
  }

  return { success: true, data }
}

export async function getMemberKeyEnvelope(userId?: string) {
  const accountId = await getCurrentAccountId()
  if (!accountId) {
    return { success: false, error: 'لا يوجد مساحة عمل مفعّلة' }
  }

  let resolvedUserId = userId
  if (!resolvedUserId) {
    const currentUser = await getCurrentUserId()
    if (!currentUser.success) {
      return currentUser
    }
    resolvedUserId = currentUser.userId
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspace_member_key_envelopes')
    .select('id, account_id, member_user_id, encrypted_workspace_key, key_version, created_at')
    .eq('account_id', accountId)
    .eq('member_user_id', resolvedUserId)
    .maybeSingle()

  if (error) {
    console.error('getMemberKeyEnvelope error:', error)
    return { success: false, error: 'فشل جلب الظرف المشفّر للمفتاح' }
  }

  if (!data) {
    return { success: false, error: 'لا يوجد ظرف مفتاح لهذا العضو بعد' }
  }

  return { success: true, data }
}

export async function upsertMemberKeyEnvelope(params: {
  encryptedWorkspaceKey: string
  keyVersion?: string
}): Promise<SimpleResult> {
  const accountId = await getCurrentAccountId()
  if (!accountId) {
    return { success: false, error: 'لا يوجد مساحة عمل مفعّلة' }
  }

  const currentUser = await getCurrentUserId()
  if (!currentUser.success) {
    return currentUser
  }

  if (!params.encryptedWorkspaceKey) {
    return { success: false, error: 'النص المشفّر للمفتاح مطلوب' }
  }

  const supabase = await createClient()
  const payload = {
    account_id: accountId,
    member_user_id: currentUser.userId,
    encrypted_workspace_key: params.encryptedWorkspaceKey,
    key_version: params.keyVersion ?? 'v1',
    created_at: nowIso(),
  }

  const { error } = await supabase
    .from('workspace_member_key_envelopes')
    .upsert(payload, { onConflict: 'account_id,member_user_id' })

  if (error) {
    console.error('upsertMemberKeyEnvelope error:', error)
    return { success: false, error: 'تعذّر حفظ الظرف المشفّر للمفتاح' }
  }

  return { success: true }
}
