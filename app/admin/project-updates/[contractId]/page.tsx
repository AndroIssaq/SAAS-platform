import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectUpdatesWithComments } from '@/components/admin/project-updates-with-comments'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function ContractUpdatesPage({
  params,
}: {
  params: Promise<{ contractId: string }>
}) {
  const { contractId } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'admin') {
    redirect('/')
  }

  // Fetch contract details
  const { data: contract } = await supabase
    .from('contracts')
    .select('contract_number, client_name, service_type')
    .eq('id', contractId)
    .single()

  if (!contract) {
    redirect('/admin/project-updates')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/project-updates">
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">التحديثات والتعليقات</h1>
          <p className="text-muted-foreground">
            عقد: {contract.contract_number} | العميل: {contract.client_name}
          </p>
        </div>
      </div>

      <ProjectUpdatesWithComments contractId={contractId} />
    </div>
  )
}
