import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Auth error in middleware:', error)
    }
    user = data?.user || null
  } catch (error) {
    console.error('Unexpected auth error in middleware:', error)
  }

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth", "/portfolio"]
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/portfolio/") ||
    pathname.startsWith("/api/auth/activation") ||
    pathname.startsWith("/embed/") ||
    pathname.startsWith("/forms/")

  // Redirect to login if not authenticated (except for public routes)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is authenticated, check role-based access
  if (user) {
    // IMPORTANT: Use auth metadata role FIRST (for new users who don't have DB record yet)
    // The metadata.role is set during signup and is the source of truth
    let userRole = (user.user_metadata?.role as string | undefined) || "client"

    // Try to get role from database as backup/verification (but don't override if not found)
    try {
      const { data: userData, error: dbError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      // Only use DB role if query succeeded and has a role
      if (!dbError && userData?.role) {
        userRole = userData.role
      }
    } catch (error) {
      // Silently ignore - use metadata role
      console.log('Using metadata role for user:', user.id)
    }

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (userRole !== "admin") {
        const url = request.nextUrl.clone()
        url.pathname = userRole === "affiliate" ? "/affiliate/dashboard" : "/client/dashboard"
        return NextResponse.redirect(url)
      }
    }

    // Affiliate routes protection
    if (pathname.startsWith("/affiliate")) {
      if (userRole !== "affiliate") {
        const url = request.nextUrl.clone()
        url.pathname = userRole === "admin" ? "/admin/dashboard" : "/client/dashboard"
        return NextResponse.redirect(url)
      }
    }

    // Client routes protection
    if (pathname.startsWith("/client")) {
      if (userRole !== "client") {
        const url = request.nextUrl.clone()
        url.pathname = userRole === "admin" ? "/admin/dashboard" : "/affiliate/dashboard"
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

