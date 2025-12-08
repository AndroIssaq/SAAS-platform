import { createClient } from '@/lib/supabase/server'
import { getCurrentClient } from '@/lib/actions/onboarding'

export default async function ClientDebugPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Client Debug - Not Logged In</h1>
        <p>Please log in first to debug client data.</p>
      </div>
    )
  }

  // Get user details
  const { data: userDetails } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single()

  // Get client data using getCurrentClient
  const clientResult = await getCurrentClient()

  // Try to find client directly
  const { data: directClient } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Try to find client by email
  const { data: emailClient } = await supabase
    .from('clients')
    .select('*')
    .filter('onboarding_data->>email', 'eq', user.email)
    .maybeSingle()

  // Get contracts for this user (if client exists)
  let contracts = []
  if (clientResult.success && clientResult.data) {
    const { data: clientContracts } = await supabase
      .from('contracts')
      .select('*')
      .eq('client_id', clientResult.data.id)
      .order('created_at', { ascending: false })
    contracts = clientContracts || []
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Client Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current User</h2>
          <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">User Details (from users table)</h2>
          <pre className="text-sm">{JSON.stringify(userDetails, null, 2)}</pre>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">getCurrentClient() Result</h2>
          <pre className="text-sm">{JSON.stringify(clientResult, null, 2)}</pre>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Direct Client Query (by user_id)</h2>
          <pre className="text-sm">{JSON.stringify(directClient, null, 2)}</pre>
        </div>

        <div className="bg-pink-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Email Client Query (by email)</h2>
          <pre className="text-sm">{JSON.stringify(emailClient, null, 2)}</pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Contracts Found ({contracts.length})</h2>
          <pre className="text-sm">{JSON.stringify(contracts, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}