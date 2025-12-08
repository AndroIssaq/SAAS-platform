import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectUpdatesManager } from '@/components/admin/project-updates-manager'

export default async function AdminProjectUpdatesPage() {
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

  // Fetch clients with active contracts
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      id,
      contract_number,
      client_id,
      client_name,
      service_type,
      status,
      workflow_status,
      created_at
    `)
    .or('status.eq.active,workflow_status.eq.completed')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">تحديثات المشاريع</h1>
        <p className="text-muted-foreground">إرسال تحديثات إلى العملاء حول مشاريعهم</p>
      </div>

      <ProjectUpdatesManager contracts={contracts || []} />
    </div>
  )
}
