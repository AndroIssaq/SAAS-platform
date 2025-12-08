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
        email: user.email,
        session: user.session_id
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
      error: userError,
      found: !!userData
    })

    // Step 2: Check clients table with regular client (RLS)
    console.log('🔍 Checking clients table with regular client for user_id:', user.id)
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    results.steps.push({
      step: 'clients_table_regular',
      userId: user.id,
      data: clientData,
      error: clientError,
      found: !!clientData
    })

    // Step 3: Check clients table with admin client (bypass RLS)
    await withAdminClient(async (admin) => {
      console.log('🔍 Checking clients table with admin client for user_id:', user.id)
      const { data: adminClientData, error: adminClientError } = await admin
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      results.steps.push({
        step: 'clients_table_admin',
        userId: user.id,
        data: adminClientData,
        error: adminClientError,
        found: !!adminClientData
      })

      // Step 4: Check ALL clients to see total count
      const { data: allClients, error: allClientsError } = await admin
        .from('clients')
        .select('*')
        .limit(10)

      results.steps.push({
        step: 'all_clients_admin',
        count: allClients?.length || 0,
        data: allClients,
        error: allClientsError,
        firstClient: allClients?.[0]
      })

      // Step 5: Check contracts
      if (adminClientData) {
        const { data: contracts, error: contractsError } = await admin
          .from('contracts')
          .select('*')
          .eq('client_id', adminClientData.id)
          .limit(5)

        results.steps.push({
          step: 'contracts_by_client_id',
          clientId: adminClientData.id,
          count: contracts?.length || 0,
          data: contracts,
          error: contractsError
        })
      }
    })

    return NextResponse.json(results)

  } catch (error) {
    console.error('Session debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}