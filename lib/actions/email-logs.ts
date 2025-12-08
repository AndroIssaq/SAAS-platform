'use server'

import { createClient } from '@/lib/supabase/server'

export async function getEmailLogs(limit = 100) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data }
}
