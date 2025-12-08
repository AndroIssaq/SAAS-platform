'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentAccountId } from '@/lib/actions/account'

export async function getAllPortfolioProjects() {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  let query = supabase
    .from('portfolio_projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data }
}

export async function getPortfolioProjectById(id: string) {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  let query = supabase
    .from('portfolio_projects')
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

export async function createPortfolioProject(projectData: any) {
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
    .from('portfolio_projects')
    .insert({ ...projectData, account_id: accountId, created_by: user.id })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updatePortfolioProject(id: string, projectData: any) {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  if (!accountId) {
    return { success: false, error: 'لم يتم العثور على حساب مرتبط بالمستخدم.' }
  }

  const { data, error } = await supabase
    .from('portfolio_projects')
    .update(projectData)
    .eq('id', id)
    .eq('account_id', accountId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
