'use server'

import { createClient } from '@/lib/supabase/server'

export async function getContractDeletionStatus(contractId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contract_deletion_requests')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // No deletion request found
    return { success: true, data: null }
  }

  return { success: true, data }
}

export async function requestContractDeletion(contractId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح' }
  }

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('account_id')
    .eq('id', contractId)
    .single()

  if (contractError || !contract?.account_id) {
    return { success: false, error: 'فشل في جلب بيانات العقد' }
  }

  const { data, error } = await supabase
    .from('contract_deletion_requests')
    .insert({
      account_id: contract.account_id,
      contract_id: contractId,
      requested_by: user.id,
      reason,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Delete contract directly (Admin only)
 */
export async function deleteContractDirectly(contractId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح' }
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    return { success: false, error: 'غير مصرح - يجب أن تكون مديراً' }
  }

  try {
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('account_id')
      .eq('id', contractId)
      .single()

    if (contractError || !contract?.account_id) {
      return { success: false, error: 'فشل في جلب بيانات العقد' }
    }

    // Log the deletion
    await supabase.from('contract_activities').insert({
      account_id: contract.account_id,
      contract_id: contractId,
      activity_type: 'contract_deleted',
      description: `تم حذف العقد: ${reason}`,
      metadata: {
        deleted_by: user.id,
        reason,
        timestamp: new Date().toISOString()
      }
    })

    // Delete the contract
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return {
      success: true,
      message: 'تم حذف العقد بنجاح'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'حدث خطأ أثناء حذف العقد'
    }
  }
}

export async function getDeletionRequests() {
  const supabase = await createClient()
  // Admin only check implicit via RLS or explicit role check usually

  const { data, error } = await supabase
    .from('contract_deletion_requests')
    .select('*, contracts(contract_number, client_id)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching deletion requests:', error)
    return []
  }

  return data
}

export async function reviewDeletionRequest(requestId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contract_deletion_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
