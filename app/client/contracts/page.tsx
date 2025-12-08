import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ContractsListRealtime } from "@/components/client/contracts-list-realtime"
import { getCurrentClient } from "@/lib/actions/onboarding"
import { withAdminClient } from "@/lib/supabase/admin"

export default async function ClientContractsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // احصل على سجل العميل المرتبط بالمستخدم الحالي
  const clientResult = await getCurrentClient()

  console.log('ClientContractsPage - getCurrentClient result:', {
    success: clientResult.success,
    data: clientResult.data,
    error: clientResult.error,
    userId: user.id,
    userEmail: user.email
  })

  if (!clientResult.success || !clientResult.data) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">عقودي</h1>
        <p className="text-muted-foreground mb-4">
          لا يوجد حالياً ملف عميل مرتبط بحسابك، لذلك لا يمكن عرض عقود.
          عندما يرسل لك مزود الخدمة عقداً عبر عَقدي ويتم ربطه ببريدك الإلكتروني، ستظهر العقود هنا تلقائياً.
        </p>
        <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
          <p className="font-semibold mb-2">Debug Info:</p>
          <p>User ID: {user.id}</p>
          <p>User Email: {user.email}</p>
          <p>Error: {clientResult.error}</p>
        </div>
      </div>
    )
  }

  const client = clientResult.data

  console.log('ClientContractsPage - Loading contracts for client:', {
    clientId: client.id,
    clientUserId: client.user_id,
    clientEmail: client.onboarding_data?.email
  })

  // Get client's contracts using clients.id (FK في contracts.client_id) with admin client
  let contracts: any[] = []
  let contractsError: any = null

  try {
    await withAdminClient(async (admin) => {
      console.log('🔄 Loading contracts with admin client for client_id:', client.id)
      
      const { data, error } = await admin
        .from("contracts")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
      
      console.log('✅ Admin contract query result:', {
        dataCount: data?.length || 0,
        error: error,
        firstContract: data?.[0]
      })
      
      contracts = data || []
      contractsError = error
    })
  } catch (error) {
    console.error('ClientContractsPage - Admin client error:', error)
    contractsError = error
  }

  console.log('ClientContractsPage - Final contract loading result:', {
    contractsCount: contracts?.length || 0,
    contractsError: contractsError,
    firstContract: contracts?.[0]
  })

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">عقودي</h1>
        <p className="text-muted-foreground">جميع العقود الخاصة بك مع تحديثات فورية</p>
        {contracts.length === 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              لا توجد عقود حالياً. عندما يرسل لك مزود الخدمة عقداً، سيتم عرضه هنا.
            </p>
            <div className="mt-2 text-sm text-blue-600">
              <p>Client ID: {client.id}</p>
              <p>Contracts found: {contracts.length}</p>
            </div>
          </div>
        )}
      </div>

      <ContractsListRealtime initialContracts={contracts || []} userId={client.id} />
    </div>
  )
}
