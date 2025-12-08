'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentAccountId } from '@/lib/actions/account'

export interface AdminReportsData {
  totals: {
    totalUsers: number
    totalClients: number
    totalAffiliates: number
    totalContracts: number
    activeContracts: number
    completedContracts: number
    totalRevenue: number
  }
  contractsByStatus: { status: string; count: number }[]
  contractsByMonth: { month: string; count: number; revenue: number }[]
  topServices: { service_type: string; contractsCount: number; totalAmount: number }[]
  affiliates: {
    totalAffiliates: number
    totalReferrals: number
    totalEarnings: number
    pendingEarnings: number
    totalPayouts: number
  }
  emails: {
    totalSent: number
    totalFailed: number
    last30DaysSent: number
  }
  projectUpdates: {
    totalUpdates: number
    unreadUpdates: number
  }
}

import { requireActiveSubscription } from '@/lib/actions/subscription-guard'

export async function getAdminReports(): Promise<AdminReportsData> {
  // Optional: We can allow viewing reports even if expired, or block. 
  // Blocking adds pressure to subscribe.
  // UPDATE: Removing strict block to prevent dashboard crash and allow transparency overlay
  // await requireActiveSubscription()

  const supabase = await createClient()
  const accountId = await getCurrentAccountId()


  // If we have an account context, scope all stats to this workspace
  if (accountId) {
    const { data: accountContracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, status, total_amount, service_type, affiliate_id, client_id, created_at, account_id')
      .eq('account_id', accountId)

    const contracts = !contractsError && accountContracts ? accountContracts : []

    const contractIds = contracts.map((c: any) => c.id)
    const clientIds = Array.from(
      new Set(
        contracts
          .map((c: any) => c.client_id)
          .filter((id: string | null) => !!id),
      ),
    )
    const affiliateIds = Array.from(
      new Set(
        contracts
          .map((c: any) => c.affiliate_id)
          .filter((id: string | null) => !!id),
      ),
    )

    const { data: members } = await supabase
      .from('account_members')
      .select('user_id')
      .eq('account_id', accountId)

    const memberUserIds = Array.from(new Set((members || []).map((m: any) => m.user_id)))

    const totalUsers = memberUserIds.length + clientIds.length
    const totalClients = clientIds.length
    const totalAffiliates = affiliateIds.length

    const activeStatuses = ['active', 'in_progress']
    const completedStatuses = ['completed']

    const totalContracts = contracts.length
    const activeContracts = contracts.filter((c: any) => activeStatuses.includes(c.status)).length
    const completedContracts = contracts.filter((c: any) => completedStatuses.includes(c.status)).length
    const totalRevenue = contracts.reduce((sum: number, c: any) => sum + (Number(c.total_amount) || 0), 0)

    const statusMap: Record<string, number> = {}
    for (const c of contracts) {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1
    }
    const contractsByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

    const now = new Date()
    const months: { month: string; count: number; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({ month: label, count: 0, revenue: 0 })
    }

    const monthIndex = (createdAt: string) => {
      const d = new Date(createdAt)
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return months.findIndex((m) => m.month === label)
    }

    for (const c of contracts) {
      if (!c.created_at) continue
      const idx = monthIndex(c.created_at)
      if (idx !== -1) {
        months[idx].count += 1
        months[idx].revenue += Number(c.total_amount) || 0
      }
    }

    const serviceMap: Record<string, { contractsCount: number; totalAmount: number }> = {}
    for (const c of contracts) {
      const key = c.service_type || 'غير محدد'
      if (!serviceMap[key]) {
        serviceMap[key] = { contractsCount: 0, totalAmount: 0 }
      }
      serviceMap[key].contractsCount += 1
      serviceMap[key].totalAmount += Number(c.total_amount) || 0
    }
    const topServices = Object.entries(serviceMap)
      .map(([service_type, v]) => ({ service_type, ...v }))
      .sort((a, b) => b.contractsCount - a.contractsCount)
      .slice(0, 5)

    let affiliatesRows: any[] = []
    let payouts: any[] = []

    if (affiliateIds.length > 0) {
      const { data: affiliatesData } = await supabase
        .from('affiliates')
        .select('total_earnings, pending_earnings, total_referrals')
        .in('id', affiliateIds)

      affiliatesRows = affiliatesData || []

      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('amount, status, affiliate_id')
        .in('affiliate_id', affiliateIds)

      payouts = payoutsData || []
    }

    const affiliatesStats = affiliatesRows.reduce(
      (acc: any, row: any) => {
        acc.totalReferrals += row.total_referrals || 0
        acc.totalEarnings += Number(row.total_earnings) || 0
        acc.pendingEarnings += Number(row.pending_earnings) || 0
        return acc
      },
      { totalReferrals: 0, totalEarnings: 0, pendingEarnings: 0 },
    )

    const totalPayouts = payouts
      .filter((p: any) => p.status === 'paid')
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)

    const { data: emailLogsData } = await supabase
      .from('email_logs')
      .select('status, created_at')
      .eq('account_id', accountId)

    const emailLogs = emailLogsData || []

    const { data: projectUpdatesData } = await supabase
      .from('project_updates')
      .select('is_read')
      .eq('account_id', accountId)

    const projectUpdates = projectUpdatesData || []

    const totalSent = emailLogs.filter((e: any) => e.status === 'sent').length
    const totalFailed = emailLogs.filter((e: any) => e.status === 'failed').length

    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    const last30DaysSent = emailLogs.filter((e: any) => {
      if (!e.created_at) return false
      const d = new Date(e.created_at)
      return e.status === 'sent' && d >= last30Days
    }).length

    const totalUpdates = projectUpdates.length
    const unreadUpdates = projectUpdates.filter((u: any) => !u.is_read).length

    return {
      totals: {
        totalUsers,
        totalClients,
        totalAffiliates,
        totalContracts,
        activeContracts,
        completedContracts,
        totalRevenue,
      },
      contractsByStatus,
      contractsByMonth: months,
      topServices,
      affiliates: {
        totalAffiliates,
        totalReferrals: affiliatesStats.totalReferrals,
        totalEarnings: affiliatesStats.totalEarnings,
        pendingEarnings: affiliatesStats.pendingEarnings,
        totalPayouts,
      },
      emails: {
        totalSent,
        totalFailed,
        last30DaysSent,
      },
      projectUpdates: {
        totalUpdates,
        unreadUpdates,
      },
    }
  }

  // Fallback: previous global behavior when no account context is available
  const [usersCountRes, clientsCountRes, affiliatesCountRes, contractsRes, affiliatesRes, payoutsRes, emailLogsRes, projectUpdatesRes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('affiliates').select('*', { count: 'exact', head: true }),
    supabase
      .from('contracts')
      .select('id, status, total_amount, service_type, affiliate_id, created_at'),
    supabase.from('affiliates').select('total_earnings, pending_earnings, total_referrals'),
    supabase.from('payouts').select('amount, status'),
    supabase.from('email_logs').select('status, created_at'),
    supabase.from('project_updates').select('is_read'),
  ])

  const totalUsers = usersCountRes.count || 0
  const totalClients = clientsCountRes.count || 0
  const totalAffiliates = affiliatesCountRes.count || 0

  const contracts = contractsRes.data || []
  const affiliatesRows = affiliatesRes.data || []
  const payouts = payoutsRes.data || []
  const emailLogs = emailLogsRes.data || []
  const projectUpdates = projectUpdatesRes.data || []

  const activeStatuses = ['active', 'in_progress']
  const completedStatuses = ['completed']

  const totalContracts = contracts.length
  const activeContracts = contracts.filter((c: any) => activeStatuses.includes(c.status)).length
  const completedContracts = contracts.filter((c: any) => completedStatuses.includes(c.status)).length
  const totalRevenue = contracts.reduce((sum: number, c: any) => sum + (Number(c.total_amount) || 0), 0)

  const statusMap: Record<string, number> = {}
  for (const c of contracts) {
    statusMap[c.status] = (statusMap[c.status] || 0) + 1
  }
  const contractsByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

  const now = new Date()
  const months: { month: string; count: number; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ month: label, count: 0, revenue: 0 })
  }

  const monthIndex = (createdAt: string) => {
    const d = new Date(createdAt)
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return months.findIndex((m) => m.month === label)
  }

  for (const c of contracts) {
    if (!c.created_at) continue
    const idx = monthIndex(c.created_at)
    if (idx !== -1) {
      months[idx].count += 1
      months[idx].revenue += Number(c.total_amount) || 0
    }
  }

  const serviceMap: Record<string, { contractsCount: number; totalAmount: number }> = {}
  for (const c of contracts) {
    const key = c.service_type || 'غير محدد'
    if (!serviceMap[key]) {
      serviceMap[key] = { contractsCount: 0, totalAmount: 0 }
    }
    serviceMap[key].contractsCount += 1
    serviceMap[key].totalAmount += Number(c.total_amount) || 0
  }
  const topServices = Object.entries(serviceMap)
    .map(([service_type, v]) => ({ service_type, ...v }))
    .sort((a, b) => b.contractsCount - a.contractsCount)
    .slice(0, 5)

  const affiliatesStats = affiliatesRows.reduce(
    (acc: any, row: any) => {
      acc.totalReferrals += row.total_referrals || 0
      acc.totalEarnings += Number(row.total_earnings) || 0
      acc.pendingEarnings += Number(row.pending_earnings) || 0
      return acc
    },
    { totalReferrals: 0, totalEarnings: 0, pendingEarnings: 0 },
  )

  const totalPayouts = payouts
    .filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)

  const totalSent = emailLogs.filter((e: any) => e.status === 'sent').length
  const totalFailed = emailLogs.filter((e: any) => e.status === 'failed').length

  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)
  const last30DaysSent = emailLogs.filter((e: any) => {
    if (!e.created_at) return false
    const d = new Date(e.created_at)
    return e.status === 'sent' && d >= last30Days
  }).length

  const totalUpdates = projectUpdates.length
  const unreadUpdates = projectUpdates.filter((u: any) => !u.is_read).length

  return {
    totals: {
      totalUsers,
      totalClients,
      totalAffiliates,
      totalContracts,
      activeContracts,
      completedContracts,
      totalRevenue,
    },
    contractsByStatus,
    contractsByMonth: months,
    topServices,
    affiliates: {
      totalAffiliates,
      totalReferrals: affiliatesStats.totalReferrals,
      totalEarnings: affiliatesStats.totalEarnings,
      pendingEarnings: affiliatesStats.pendingEarnings,
      totalPayouts,
    },
    emails: {
      totalSent,
      totalFailed,
      last30DaysSent,
    },
    projectUpdates: {
      totalUpdates,
      unreadUpdates,
    },
  }
}
