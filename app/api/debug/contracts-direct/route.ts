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

    // Step 1: Check if client exists for this user
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    results.steps.push({
      step: 'client_lookup_regular',
      data: clientData,
      error: clientError,
      found: !!clientData
    })

    if (clientData) {
      // Step 2: Try to get contracts with regular client (RLS)
      const { data: contractsRegular, error: contractsRegularError } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false })

      results.steps.push({
        step: 'contracts_regular_client',
        clientId: clientData.id,
        data: contractsRegular,
        error: contractsRegularError,
        count: contractsRegular?.length || 0
      })

      // Step 3: Try to get contracts with admin client (bypass RLS)
      await withAdminClient(async (admin) => {
        const { data: contractsAdmin, error: contractsAdminError } = await admin
          .from('contracts')
          .select('*')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false })

        results.steps.push({
          step: 'contracts_admin_client',
          clientId: clientData.id,
          data: contractsAdmin,
          error: contractsAdminError,
          count: contractsAdmin?.length || 0
        })

        // Step 4: Check ALL contracts to see if any exist
        const { data: allContracts, error: allContractsError } = await admin
          .from('contracts')
          .select('*')
          .limit(5)

        results.steps.push({
          step: 'all_contracts_admin',
          data: allContracts,
          error: allContractsError,
          count: allContracts?.length || 0,
          firstContract: allContracts?.[0]
        })

        // Step 5: Check contracts by email
        if (user.email) {
          const { data: contractsByEmail, error: contractsByEmailError } = await admin
            .from('contracts')
            .select('*')
            .eq('client_email', user.email)
            .order('created_at', { ascending: false })

          results.steps.push({
            step: 'contracts_by_email_admin',
            email: user.email,
            data: contractsByEmail,
            error: contractsByEmailError,
            count: contractsByEmail?.length || 0
          })
        }
      })
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}