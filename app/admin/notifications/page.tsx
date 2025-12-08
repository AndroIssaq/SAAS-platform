import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NotificationsListZustand } from "@/components/notifications/notifications-list"

export default async function AdminNotificationsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">الإشعارات</h1>
        <p className="text-muted-foreground">جميع الإشعارات والتحديثات المحدثة باستخدام Zustand</p>
      </div>

      <NotificationsListZustand userId={user.id} />
    </div>
  )
}
