'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentAccountId } from '@/lib/actions/account'

export async function getAllServices() {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  let query = supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // If we have an account context, scope services to that workspace
  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data }
}

export async function getServiceById(id: string) {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  let query = supabase
    .from('services')
    .select('*')
    .eq('id', id)

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query.single()

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data }
}

export async function createService(serviceData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح' }
  }

  const accountId = await getCurrentAccountId()

  if (!accountId) {
    return { success: false, error: 'لم يتم العثور على حساب مرتبط بالمستخدم.' }
  }

  const { data, error } = await supabase
    .from('services')
    .insert({ ...serviceData, account_id: accountId, created_by: user.id })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateService(id: string, serviceData: any) {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  if (!accountId) {
    return { success: false, error: 'لم يتم العثور على حساب مرتبط بالمستخدم.' }
  }

  const { data, error } = await supabase
    .from('services')
    .update(serviceData)
    .eq('id', id)
    .eq('account_id', accountId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function deleteService(id: string) {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  if (!accountId) {
    return { success: false, error: 'لم يتم العثور على حساب مرتبط بالمستخدم.' }
  }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('account_id', accountId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, message: 'تم حذف الخدمة بنجاح' }
}

export async function toggleServiceStatus(id: string) {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  if (!accountId) {
    return { success: false, error: 'لم يتم العثور على حساب مرتبط بالمستخدم.' }
  }

  const { data: service, error: fetchError } = await supabase
    .from('services')
    .select('is_active')
    .eq('id', id)
    .eq('account_id', accountId)
    .single()

  if (fetchError || !service) {
    return { success: false, error: fetchError?.message || 'الخدمة غير موجودة' }
  }

  const newStatus = !service.is_active

  const { error: updateError } = await supabase
    .from('services')
    .update({ is_active: newStatus })
    .eq('id', id)
    .eq('account_id', accountId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return {
    success: true,
    message: newStatus ? 'تم تفعيل الخدمة بنجاح' : 'تم تعطيل الخدمة بنجاح',
  }
}
