import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/client/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get role from user metadata (temporary fix to avoid RLS infinite recursion)
        const userRole = user.user_metadata?.role || "client"

        // Redirect based on user role from metadata
        if (userRole === "admin") {
          return NextResponse.redirect(`${origin}/admin/dashboard`)
        } else if (userRole === "affiliate") {
          return NextResponse.redirect(`${origin}/affiliate/dashboard`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
