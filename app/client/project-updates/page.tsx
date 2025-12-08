import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientProjectUpdatesView } from '@/components/client/client-project-updates-view'

export default async function ClientProjectUpdatesPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is client
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'client') {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">تحديثات مشاريعي</h1>
        <p className="text-muted-foreground">
          آخر التحديثات والأخبار حول مشاريعك
        </p>
      </div>

      <ClientProjectUpdatesView clientId={user.id} />
    </div>
  )
}
