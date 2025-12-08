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

    // Step 2: Check clients table with regular client (RLS)
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    results.steps.push({
      step: 'clients_table_regular',
      data: clientData,
      error: clientError
    })

    // Step 3: Check clients table with admin client (bypass RLS)
    await withAdminClient(async (admin) => {
      const { data: adminClientData, error: adminClientError } = await admin
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      results.steps.push({
        step: 'clients_table_admin',
        data: adminClientData,
        error: adminClientError
      })

      // Step 4: Check clients by email with admin
      if (user.email) {
        const { data: emailClientData, error: emailClientError } = await admin
          .from('clients')
          .select('*')
          .filter('onboarding_data->>email', 'eq', user.email)
          .maybeSingle()

        results.steps.push({
          step: 'clients_by_email_admin',
          data: emailClientData,
          error: emailClientError
        })

        // Step 5: Check ALL clients with admin to see if any exist
        const { data: allClientsData, error: allClientsError } = await admin
          .from('clients')
          .select('*')
          .limit(10)

        results.steps.push({
          step: 'all_clients_admin',
          count: allClientsData?.length || 0,
          data: allClientsData,
          error: allClientsError
        })
      }
    })

    // Step 6: Check RLS policies
    await withAdminClient(async (admin) => {
      try {
        const { data: rlsData, error: rlsError } = await admin
          .rpc('get_policies', { table_name: 'clients' })
        
        results.steps.push({
          step: 'rls_policies',
          data: rlsData,
          error: rlsError
        })
      } catch (rlsCheckError) {
        results.steps.push({
          step: 'rls_policies',
          data: null,
          error: rlsCheckError.message
        })
      }
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