import type React from "react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { ensureUserAccount } from "@/lib/actions/account"
import { getSubscriptionStatus } from "@/lib/actions/subscriptions"
import { SubscriptionGuard } from "@/components/subscription/subscription-guard"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // IMPORTANT: Check auth metadata role FIRST (for new users)
  // This is set during signup and is the source of truth
  const metadataRole = user.user_metadata?.role as string | undefined

  // Try to get user details from database
  const { data: userData } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single()

  // Use metadata role if DB record doesn't exist yet, otherwise use DB role
  const effectiveRole = userData?.role || metadataRole || "client"
  const userName = userData?.full_name || user.user_metadata?.full_name || "Admin"

  // Check if user has admin role (from either source)
  if (effectiveRole !== "admin") {
    // Redirect based on their actual role
    if (effectiveRole === "affiliate") {
      redirect("/affiliate/dashboard")
    } else {
      redirect("/client/dashboard")
    }
  }

  // Ensure the admin user has a workspace account + membership
  // This will create the users record if it doesn't exist
  await ensureUserAccount()

  // Get current path to check if we should bypass blocking
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || ""

  // Bypass blocking for subscription pages - users need access to pay
  const isSubscriptionPage = pathname.includes("/subscription")

  // Get subscription status for blocking check
  const subscriptionStatus = await getSubscriptionStatus()

  // Determine if we should block
  const shouldBlock = subscriptionStatus.isBlocked && !isSubscriptionPage

  return (
    <SidebarLayout userRole="admin" userId={user.id} userName={userName}>
      <div className="p-6 lg:p-8">
        {/* If subscription is blocked and NOT on subscription page, show blocking UI */}
        {shouldBlock ? (
          <SubscriptionGuard>
            {children}
          </SubscriptionGuard>
        ) : (
          children
        )}
      </div>
    </SidebarLayout>
  )
}

