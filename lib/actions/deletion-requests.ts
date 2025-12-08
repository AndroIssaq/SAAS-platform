'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDeletionRequests() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contract_deletion_requests')
    .select('*, contracts(contract_number, client_name), users(full_name, email)')
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data }
}

export async function approveDeletionRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح' }
  }

  const { error } = await supabase
    .from('contract_deletion_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function rejectDeletionRequest(requestId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح' }
  }

  const { error } = await supabase
    .from('contract_deletion_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
