'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentAccountId } from '@/lib/actions/account'
import { decrypt } from '@/lib/encryption'

export async function getDashboardStats() {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  let totalClients = 0
  let activeProjects = 0
  let totalContracts = 0
  let publishedPortfolio = 0

  if (accountId) {
    // Scope stats to current account workspace
    const { data: accountContracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, client_id')
      .eq('account_id', accountId)

    if (!contractsError && accountContracts) {
      totalContracts = accountContracts.length

      const contractClientIds = new Set(
        accountContracts
          .map((c: any) => c.client_id)
          .filter((id: string | null) => !!id),
      )

      // Also try to count clients directly linked to the account OR created by the user
      const directClientIds = new Set<string>()
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Account Linked
      try {
        const { data: directClients, error: directError } = await supabase
          .from('clients')
          .select('user_id')
          .eq('account_id', accountId)

        if (!directError && directClients) {
          directClients.forEach((c: any) => {
            if (c.user_id) directClientIds.add(c.user_id)
          })
        }
      } catch (err) { }

      // 2. Created By User (Manual entries)
      if (user?.id) {
        try {
          const { data: createdClients, error: createdError } = await supabase
            .from('clients')
            .select('user_id')
            .eq('created_by', user.id)

          if (!createdError && createdClients) {
            createdClients.forEach((c: any) => {
              if (c.user_id) directClientIds.add(c.user_id)
            })
          }
        } catch (err) { }
      }

      // Merge sets
      const allClientIds = new Set([...contractClientIds, ...directClientIds])
      totalClients = allClientIds.size

      const contractIds = accountContracts.map((c: any) => c.id)

      if (contractIds.length > 0) {
        const { count: projectsCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .in('status', ['in_progress', 'active'])
          .in('contract_id', contractIds)

        activeProjects = projectsCount || 0
      }
    }

    const { count: portfolioCount } = await supabase
      .from('portfolio_projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('account_id', accountId)

    publishedPortfolio = portfolioCount || 0
  } else {
    // Fallback: global stats if no account context is available
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    const { count: activeProjectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('status', ['in_progress', 'active'])

    const { count: contractsCount } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })

    const { count: portfolioCount } = await supabase
      .from('portfolio_projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    totalClients = clientsCount || 0
    activeProjects = activeProjectsCount || 0
    totalContracts = contractsCount || 0
    publishedPortfolio = portfolioCount || 0
  }

  return {
    totalClients,
    activeProjects,
    totalContracts,
    publishedPortfolio,
  }
}

export async function getAllClients() {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()
  const { data: { user } } = await supabase.auth.getUser()

  let allClients: any[] = []

  // إذا كان هناك Workspace حالي، نعرض فقط العملاء المرتبطين بعقود هذا الحساب
  if (accountId) {
    const clientUserIds = new Set<string>()

    // 1. Get clients from contracts (Active Clients)
    const { data: accountContracts, error: contractsError } = await supabase
      .from('contracts')
      .select('client_id')
      .eq('account_id', accountId)

    if (!contractsError && accountContracts) {
      accountContracts.forEach((c: any) => {
        if (c.client_id) clientUserIds.add(c.client_id)
      })
    }

    // 2. Fetch clients based on Contract Relationship
    let contractClients: any[] = []
    if (clientUserIds.size > 0) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .in('user_id', Array.from(clientUserIds))
        .order('created_at', { ascending: false })

      if (!error && data) {
        contractClients = data
      }
    }

    // 3. Try to fetch clients directly linked to the Account (Pending or No Contract)
    let directClients: any[] = []
    try {
      const { data: directData, error: directError } = await supabase
        .from('clients')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })

      if (!directError && directData) {
        directClients = directData
      }
    } catch (err) {
      console.warn('Could not fetch clients by account_id', err)
    }

    // 4. Fetch clients created by the current User (created_by) - Handling manual DB entries
    let createdByClients: any[] = []
    if (user?.id) {
      try {
        const { data: createdData, error: createdError } = await supabase
          .from('clients')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })

        if (!createdError && createdData) {
          createdByClients = createdData
        }
      } catch (err) {
        // Ignore if created_by doesn't exist
      }
    }

    // 5. Merge unique clients
    const clientMap = new Map()
    contractClients.forEach(c => clientMap.set(c.id, c))
    directClients.forEach(c => clientMap.set(c.id, c))
    createdByClients.forEach(c => clientMap.set(c.id, c))

    allClients = Array.from(clientMap.values())

  } else {
    // في حالة عدم وجود account_id نستخدم السلوك القديم (منظور منصة كامل)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message, data: [] }
    }
    allClients = data || []
  }

  // Fetch users manually to avoid relationship error
  if (allClients.length > 0) {
    const userIds = allClients.map((c: any) => c.user_id).filter((id: any) => !!id) as string[]

    let users: any[] = []
    if (userIds.length > 0) {
      const { data: fetchedUsers, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role')
        .in('id', userIds)

      if (!usersError && fetchedUsers) {
        users = fetchedUsers
      }
    }

    // Merge and Mock User Data if Missing (Mapping data from client columns to user object)
    allClients = allClients.map((client: any) => {
      const linkedUser = users.find((u: any) => u.id === client.user_id)

      if (linkedUser) {
        return { ...client, users: linkedUser }
      } else {
        // If no linked user, we construct a "virtual" user object from the client's own columns
        // This ensures the UI (which expects client.users.email) displays the table data correctly.
        const onboardingData = client.onboarding_data || {};

        const d = (val: any) => decrypt(val) || val || '-';

        const email = d(
          client.email ||
          client.client_email ||
          client.gmail ||
          client.google_email ||
          client.contact_email ||
          onboardingData.email ||
          onboardingData.client_email
        );

        const phone = d(
          client.phone ||
          client.client_phone ||
          client.phone_number ||
          client.mobile ||
          client.contact_phone ||
          onboardingData.phone ||
          onboardingData.client_phone ||
          onboardingData.phone_number
        );

        const name = d(
          client.name ||
          client.client_name ||
          client.company_name ||
          onboardingData.company_name ||
          onboardingData.client_name ||
          'عميل بدون اسم'
        );

        const mockUser = {
          id: client.user_id || 'manual-entry',
          email,
          phone,
          full_name: name,
          role: 'client'
        }
        return {
          ...client,
          users: mockUser
        }
      }
    })
  }

  // Final Sort
  allClients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return { success: true, data: allClients }
}

export async function getClientById(id: string) {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  // إذا كان هناك Workspace، نتحقق أن هذا العميل مرتبط بعقد داخل نفس الحساب
  if (accountId) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return { success: false, error: error?.message || 'Client not found', data: null }
    }

    const clientUserId = (data as any).user_id

    if (!clientUserId) {
      // If client has no user_id (e.g. manual placeholder?), we still might want to allow viewing if account_id matches
      // Check account_id match first
      if ((data as any).account_id === accountId) {
        // Authorized via ownership
        return { success: true, data }
      }

      // Check created_by match
      if ((data as any).created_by && (data as any).created_by === (await supabase.auth.getUser()).data.user?.id) {
        return { success: true, data }
      }

      // If no user link and not owned by account, we can't verify via contract (which needs user_id)
      return { success: false, error: 'Client not linked to a user and not owned by this account', data: null }
    }

    // 1. Check direct ownership via account_id or created_by
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (
      ((data as any).account_id === accountId) ||
      ((data as any).created_by && (data as any).created_by === currentUser?.id)
    ) {
      // Authorized! Proceed to fetch user details below
    } else {
      // 2. Fallback: Check for related contract
      const { data: relatedContract, error: contractError } = await supabase
        .from('contracts')
        .select('id')
        .eq('account_id', accountId)
        .eq('client_id', clientUserId)
        .limit(1)
        .maybeSingle()

      if (contractError) {
        return { success: false, error: contractError.message, data: null }
      }

      if (!relatedContract) {
        return { success: false, error: 'Client not found in this account', data: null }
      }
    }

    // Fetch user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role')
      .eq('id', clientUserId)
      .single()

    if (user && !userError) {
      (data as any).users = user
    } else {
      // Fallback for manual client entry (no linked user)
      const client = data as any;
      const onboardingData = client.onboarding_data || {};

      const d = (val: any) => decrypt(val) || val || '-';

      const email = d(
        client.email ||
        client.client_email ||
        client.gmail ||
        client.google_email ||
        client.contact_email ||
        onboardingData.email ||
        onboardingData.client_email
      );

      const phone = d(
        client.phone ||
        client.client_phone ||
        client.phone_number ||
        client.mobile ||
        client.contact_phone ||
        onboardingData.phone ||
        onboardingData.client_phone ||
        onboardingData.phone_number
      );

      const name = d(
        client.name ||
        client.client_name ||
        client.company_name ||
        onboardingData.company_name ||
        onboardingData.client_name ||
        'عميل بدون اسم'
      );

      (data as any).users = {
        id: client.user_id || 'manual-entry',
        email,
        phone,
        full_name: name,
        role: 'client'
      }
    }

    return { success: true, data }
  }

  // Fallback: السلوك القديم بدون account scope
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return { success: false, error: error?.message || 'Client not found', data: null }
  }

  if ((data as any).user_id) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role')
      .eq('id', (data as any).user_id)
      .single()

    if (user && !userError) {
      (data as any).users = user
    }
  }

  return { success: true, data }
}

export async function getAllProjects() {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  let query = supabase
    .from('projects')
    .select('*, clients(company_name), contracts!inner(contract_number, account_id)')
    .order('created_at', { ascending: false })

  // إذا كان هناك Workspace حالي نقيد المشاريع بالعقود التابعة له
  if (accountId) {
    query = query.eq('contracts.account_id', accountId)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data }
}
