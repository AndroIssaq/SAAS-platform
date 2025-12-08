import { NextRequest, NextResponse } from 'next/server'
import { withAdminClient } from '@/lib/supabase/admin'
import { getCurrentAccountId } from '@/lib/actions/account'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = new URL(req.url).searchParams
  const roleParam = searchParams.get('role')
  const userRole = (roleParam as string | null) || (user.user_metadata?.role as string | undefined) || 'client'

  try {
    const data = await withAdminClient(async (admin) => {
      let query = admin
        .from('contracts')
        .select(`
          id,
          contract_number,
          service_type,
          total_amount,
          created_at,
          workflow_status,
          client_id,
          client_name
        `)
        .order('created_at', { ascending: false })

      if (userRole === 'admin' || userRole === 'owner') {
        const accountId = await getCurrentAccountId()
        if (!accountId) {
          return []
        }
        query = query.eq('account_id', accountId).eq('workflow_status', 'pending_admin_signature')
      } else {
        const { data: client, error: clientError } = await admin
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (clientError || !client?.id) {
          return []
        }

        query = query.eq('client_id', client.id).eq('workflow_status', 'pending_client_signature')
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data || []
    })

    const normalized = data.map((contract: any) => ({
      id: contract.id,
      contract_number: contract.contract_number,
      service_type: contract.service_type,
      total_amount: contract.total_amount,
      created_at: contract.created_at,
      workflow_status: contract.workflow_status,
      client_id: contract.client_id,
      client_name: contract.client_name,
    }))

    return NextResponse.json({ success: true, data: normalized })
  } catch (error) {
    console.error('Pending contracts API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch pending contracts' }, { status: 500 })
  }
}
