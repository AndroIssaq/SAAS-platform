import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentClient } from '@/lib/actions/onboarding'
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

    // Step 1: Check users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    results.steps.push({
      step: 'users_table',
      data: userData,
      error: userError
    })

    // Step 2: Check clients table by user_id
    const { data: clientByUserId, error: clientByUserIdError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    results.steps.push({
      step: 'clients_by_user_id',
      data: clientByUserId,
      error: clientByUserIdError
    })

    // Step 3: Check clients table by email
    if (user.email) {
      const { data: clientByEmail, error: clientByEmailError } = await supabase
        .from('clients')
        .select('*')
        .filter('onboarding_data->>email', 'eq', user.email)
        .maybeSingle()

      results.steps.push({
        step: 'clients_by_email',
        data: clientByEmail,
        error: clientByEmailError
      })
    }

    // Step 4: Use getCurrentClient function
    const clientResult = await getCurrentClient()
    results.steps.push({
      step: 'getCurrentClient',
      result: clientResult
    })

    // Step 5: Check contracts if client exists
    if (clientResult.success && clientResult.data) {
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', clientResult.data.id)
        .order('created_at', { ascending: false })

      results.steps.push({
        step: 'contracts_for_client',
        count: contracts?.length || 0,
        data: contracts,
        error: contractsError
      })
    } else {
      // Check if there are any contracts with this user's email
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
    }

    // Step 6: Admin check - get all clients and contracts
    await withAdminClient(async (admin) => {
      const { data: allClients, error: allClientsError } = await admin
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      results.steps.push({
        step: 'all_clients_admin',
        count: allClients?.length || 0,
        data: allClients,
        error: allClientsError
      })

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