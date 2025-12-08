import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        step: 'authentication'
      }, { status: 401 })
    }

    const results: any = {
      user: {
        id: user.id,
        email: user.email
      },
      steps: []
    }

    // Step 1: Get client record
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    results.steps.push({
      step: 'client_lookup_regular',
      data: clientData,
      error: clientError
    })

    // Step 2: Get client record with admin (bypass RLS)
    await withAdminClient(async (admin) => {
      const { data: adminClientData, error: adminClientError } = await admin
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      results.steps.push({
        step: 'client_lookup_admin',
        data: adminClientData,
        error: adminClientError
      })
    })

    // Step 3: Try to get contracts using regular client
    if (clientData) {
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false })

      results.steps.push({
        step: 'contracts_lookup_regular',
        count: contracts?.length || 0,
        data: contracts,
        error: contractsError
      })
    }

    // Step 4: Try to get contracts using admin client
    if (clientData) {
      await withAdminClient(async (admin) => {
        const { data: adminContracts, error: adminContractsError } = await admin
          .from('contracts')
          .select('*')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false })

        results.steps.push({
          step: 'contracts_lookup_admin',
          count: adminContracts?.length || 0,
          data: adminContracts,
          error: adminContractsError
        })
      })
    }

    // Step 5: Check all contracts by email
    const { data: contractsByEmail, error: contractsByEmailError } = await supabase
      .from('contracts')
      .select('*')
      .eq('client_email', user.email)
      .order('created_at', { ascending: false })

    results.steps.push({
      step: 'contracts_by_email',
      count: contractsByEmail?.length || 0,
      data: contractsByEmail,
      error: contractsByEmailError
    })

    // Step 6: Admin check - get all recent contracts
    await withAdminClient(async (admin) => {
      const { data: allContracts, error: allContractsError } = await admin
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      results.steps.push({
        step: 'all_contracts_admin',
        count: allContracts?.length || 0,
        data: allContracts,
        error: allContractsError
      })
    })

    return NextResponse.json(results)

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}