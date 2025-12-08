import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserAccount } from "@/lib/actions/account"

/**
 * Subscription pages layout - bypasses subscription blocking
 * Users need access to this page even when trial is expired
 */
export default async function SubscriptionLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    // Ensure account exists
    await ensureUserAccount()

    // Allow access regardless of subscription status
    return <>{children}</>
}
