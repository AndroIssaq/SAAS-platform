'use server'

import { createClient } from '@/lib/supabase/server'

export async function isSuperAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    // Check specific email for super admin privilege or admin role
    if (user.email === 'androisshaq@gmail.com') return true

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    return userData?.role === 'admin'
}

export async function getAllAdmins() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching admins:', error)
        return []
    }

    return data
}
