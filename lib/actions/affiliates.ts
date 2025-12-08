'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAffiliateStats(affiliateId: string) {
  const supabase = await createClient()

  // Get affiliate data
  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('id', affiliateId)
    .single()

  if (error || !affiliate) {
    console.error('Error fetching affiliate stats:', error)
    return {
      totalReferrals: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalPending: 0,
      totalEarnings: 0,
    }
  }

  // Return stats in the expected format
  return {
    totalReferrals: affiliate.total_referrals || 0,
    totalRevenue: 0, // Can be calculated from contracts if needed
    totalPaid: Number(affiliate.paid_earnings) || 0,
    totalPending: Number(affiliate.pending_earnings) || 0,
    totalEarnings: Number(affiliate.total_earnings) || 0,
  }
}

export async function getAffiliatePayouts(affiliateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching affiliate payouts:', error)
    return []
  }

  return data || []
}

export async function getAffiliateReferrals(affiliateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contracts')
    .select('*, clients(company_name)')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching affiliate referrals:', error)
    return []
  }

  return data || []
}

export async function getAllAffiliates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliates')
    .select('*, users(full_name, email)')
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data }
}

export async function getAllPayouts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payouts')
    .select('*, affiliates(name, email)')
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data }
}
