import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarLayout } from "@/components/layout/sidebar-layout"

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user details
  const { data: userData } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single()

  if (!userData || userData.role !== "client") {
    redirect("/")
  }

  return (
    <SidebarLayout userRole="client" userId={user.id} userName={userData.full_name || "Client"}>
      <div className="p-6 lg:p-8">{children}</div>
    </SidebarLayout>
  )
}
