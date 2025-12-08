import { createClient } from "@supabase/supabase-js"

/**
 * Supabase Admin Client with Service Role
 * للاستخدام في API routes فقط - صلاحيات كاملة
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  // Create admin client with service role key
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Type-safe wrapper for admin operations
export async function withAdminClient<T>(
  operation: (supabase: ReturnType<typeof createAdminClient>) => Promise<T>
): Promise<T> {
  const adminClient = createAdminClient()
  return await operation(adminClient)
}
