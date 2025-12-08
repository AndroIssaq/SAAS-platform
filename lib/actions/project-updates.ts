/**
 * Project Updates Actions
 * إدارة تحديثات المشاريع للعملاء
 */

'use server'

import { createClient } from "@/lib/supabase/server"
import { withAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from 'next/cache'
import { requireActiveSubscription } from '@/lib/actions/subscription-guard'

export interface ProjectUpdate {
  id: string
  contract_id: string
  client_id: string
  created_by: string
  title: string
  description?: string
  update_type: 'progress' | 'milestone' | 'completed' | 'feedback_needed' | 'issue'
  attachments: Array<{
    type: 'image' | 'link' | 'file'
    url: string
    caption?: string
    title?: string
  }>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at: string
}

export interface CreateProjectUpdateData {
  contract_id: string
  client_id: string
  title: string
  description?: string
  update_type?: 'progress' | 'milestone' | 'completed' | 'feedback_needed' | 'issue'
  attachments?: Array<{
    type: 'image' | 'link' | 'file'
    url: string
    caption?: string
    title?: string
  }>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

/**
 * Create a new project update (Admin only)
 */
export async function createProjectUpdate(data: CreateProjectUpdateData): Promise<{
  success: boolean
  data?: ProjectUpdate
  error?: string
}> {
  await requireActiveSubscription() // Security Check

  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'غير مصرح' }
    }

    // Check if user is admin
    const { data: userDetails } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userDetails?.role !== 'admin') {
      return { success: false, error: 'غير مصرح - مخصص للمدراء فقط' }
    }

    // Get account_id from related contract to scope update to current workspace
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('account_id')
      .eq('id', data.contract_id)
      .single()

    if (contractError || !contract?.account_id) {
      console.error('Error fetching contract for project update:', contractError)
      return { success: false, error: 'فشل في ربط التحديث بالعقد' }
    }

    // Try to create update in project_updates table
    const { data: update, error: insertError } = await supabase
      .from('project_updates')
      .insert({
        ...data,
        created_by: user.id,
        attachments: data.attachments || [],
        update_type: data.update_type || 'progress',
        priority: data.priority || 'normal',
        account_id: contract.account_id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating project update:', insertError)

      // Fallback: Use notifications if project_updates table doesn't exist
      if (insertError.code === 'PGRST205') {
        console.log('project_updates table not found, using notifications as fallback')

        // Format attachments for notification
        let attachmentText = ''
        if (data.attachments && data.attachments.length > 0) {
          attachmentText = '\n\n' + data.attachments.map(att => {
            if (att.type === 'image') return `🖼️ ${att.caption || 'صورة'}: ${att.url}`
            if (att.type === 'link') return `🔗 ${att.title || 'رابط'}: ${att.url}`
            return ''
          }).join('\n')
        }

        const { error: notifError } = await supabase.from('notifications').insert({
          account_id: contract.account_id,
          user_id: data.client_id,
          type: 'project_update',
          title: `📢 ${data.title}`,
          message: `${data.description || ''}${attachmentText}`,
          data: {
            contract_id: data.contract_id,
            update_type: data.update_type || 'progress',
            priority: data.priority || 'normal',
          },
          link: `/client/dashboard`,
        })

        if (notifError) {
          return { success: false, error: 'فشل في إرسال الإشعار' }
        }

        revalidatePath('/client/dashboard')
        revalidatePath('/admin/clients')

        return {
          success: true,
          data: {
            id: crypto.randomUUID(),
            ...data,
            created_by: user.id,
            is_read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any
        }
      }

      return { success: false, error: 'فشل في إنشاء التحديث' }
    }

    // Send notification to client
    await supabase.from('notifications').insert({
      account_id: contract.account_id,
      user_id: data.client_id,
      type: 'project_update',
      title: data.title,
      message: data.description || 'تحديث جديد في مشروعك',
      data: { update_id: update.id, contract_id: data.contract_id },
      link: `/client/dashboard`,
    })

    revalidatePath('/client/dashboard')
    revalidatePath('/admin/clients')

    return { success: true, data: update }
  } catch (error: any) {
    console.error('Error in createProjectUpdate:', error)
    return { success: false, error: error.message || 'حدث خطأ غير متوقع' }
  }
}

/**
 * Get project updates for a client
 */
export async function getClientProjectUpdates(clientId?: string): Promise<{
  success: boolean
  data?: ProjectUpdate[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'غير مصرح' }
    }

    // If no clientId provided, use current user
    const targetClientId = clientId || user.id

    // Fetch updates
    const { data: updates, error: fetchError } = await supabase
      .from('project_updates')
      .select('*')
      .eq('client_id', targetClientId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (fetchError) {
      console.error('Error fetching project updates:', fetchError)
      return { success: false, error: 'فشل في جلب التحديثات' }
    }

    return { success: true, data: updates || [] }
  } catch (error: any) {
    console.error('Error in getClientProjectUpdates:', error)
    return { success: false, error: error.message || 'حدث خطأ غير متوقع' }
  }
}

/**
 * Mark update as read
 */
export async function markUpdateAsRead(updateId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from('project_updates')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', updateId)

    if (updateError) {
      console.error('Error marking update as read:', updateError)
      return { success: false, error: 'فشل في تحديث الحالة' }
    }

    revalidatePath('/client/dashboard')

    return { success: true }
  } catch (error: any) {
    console.error('Error in markUpdateAsRead:', error)
    return { success: false, error: error.message || 'حدث خطأ غير متوقع' }
  }
}

/**
 * Get client dashboard stats
 */
export async function getClientDashboardStats(clientId?: string): Promise<{
  success: boolean
  data?: {
    total_contracts: number
    completed_contracts: number
    pending_contracts: number
    total_projects: number
    active_projects: number
    completed_projects: number
    total_contract_value: number
    total_updates: number
    unread_updates: number
  }
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'غير مصرح' }
    }

    // If no clientId provided, use current user
    const targetClientId = clientId || user.id

    // Try to fetch from view first
    const { data: viewStats, error: viewError } = await supabase
      .from('client_dashboard_stats')
      .select('*')
      .eq('client_id', targetClientId)
      .single()

    // If view exists and returns data, use it
    if (!viewError && viewStats) {
      return { success: true, data: viewStats }
    }

    // Fallback: Calculate stats manually
    console.log('View not found, calculating stats manually...')

    // Fetch contracts using admin client to bypass RLS for now
    console.log('📊 Fetching contracts with admin for client_id:', targetClientId)
    let contracts: any[] = []

    try {
      await withAdminClient(async (admin) => {
        const { data, error } = await admin
          .from('contracts')
          .select('id, current_step, workflow_status, total_amount')
          .eq('client_id', targetClientId)

        console.log('📊 Admin contracts query result:', {
          count: data?.length || 0,
          error: error,
          firstContract: data?.[0]
        })

        contracts = data || []
      })
    } catch (error) {
      console.error('Error fetching contracts with admin:', error)
      contracts = []
    }

    // Fetch projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, status')
      .eq('client_id', targetClientId)

    // Fetch project updates (may not exist yet)
    let updates: any[] = []
    try {
      const { data: updatesData } = await supabase
        .from('project_updates')
        .select('id, is_read')
        .eq('client_id', targetClientId)
      updates = updatesData || []
    } catch (err) {
      console.log('project_updates table not found yet, skipping...')
    }

    // Calculate stats
    const stats = {
      total_contracts: contracts?.length || 0,
      completed_contracts: contracts?.filter(c => c.current_step === 8 || c.workflow_status === 'completed').length || 0,
      pending_contracts: contracts?.filter(c => c.current_step < 8).length || 0,
      total_projects: projects?.length || 0,
      active_projects: projects?.filter(p => p.status === 'in_progress').length || 0,
      completed_projects: projects?.filter(p => p.status === 'completed' || p.status === 'delivered').length || 0,
      total_contract_value: contracts?.reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0) || 0,
      total_updates: updates?.length || 0,
      unread_updates: updates?.filter(u => !u.is_read).length || 0,
    }

    return { success: true, data: stats }
  } catch (error: any) {
    console.error('Error in getClientDashboardStats:', error)
    return { success: false, error: error.message || 'حدث خطأ غير متوقع' }
  }
}

/**
 * Get updates for a specific contract
 */
export async function getContractUpdates(contractId: string): Promise<{
  success: boolean
  data?: ProjectUpdate[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: updates, error: fetchError } = await supabase
      .from('project_updates')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching contract updates:', fetchError)
      return { success: false, error: 'فشل في جلب التحديثات' }
    }

    return { success: true, data: updates || [] }
  } catch (error: any) {
    console.error('Error in getContractUpdates:', error)
    return { success: false, error: error.message || 'حدث خطأ غير متوقع' }
  }
}

/**
 * Add comment to update
 */
export async function addUpdateComment(data: {
  update_id: string
  contract_id: string
  comment: string
  comment_type?: 'comment' | 'feedback' | 'modification_request'
}): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'غير مصرح' }
    }

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('account_id')
      .eq('id', data.contract_id)
      .single()

    if (contractError || !contract?.account_id) {
      console.error('Error fetching contract for update comment:', contractError)
      return { success: false, error: 'فشل في ربط التعليق بالعقد' }
    }

    // Check if user is admin
    const { data: userDetails } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const { data: comment, error: insertError } = await supabase
      .from('update_comments')
      .insert({
        account_id: contract.account_id,
        update_id: data.update_id,
        contract_id: data.contract_id,
        user_id: user.id,
        comment: data.comment,
        comment_type: data.comment_type || 'comment',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding comment:', insertError)
      return { success: false, error: 'فشل في إضافة التعليق' }
    }

    // Send notification to admin
    await supabase.from('notifications').insert({
      account_id: contract.account_id,
      user_id: comment.user_id,
      type: 'update_comment',
      title: 'تعليق جديد على التحديث',
      message: data.comment,
      data: { update_id: data.update_id, contract_id: data.contract_id },
      link: `/admin/project-updates`,
    })

    revalidatePath('/client/project-updates')
    revalidatePath('/admin/project-updates')

    return { success: true, data: comment }
  } catch (error: any) {
    console.error('Error in addUpdateComment:', error)
    return { success: false, error: error.message || 'حدث خطأ غير متوقع' }
  }
}

/**
 * Get comments for an update
 */
export async function getUpdateComments(updateId: string): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: comments, error: fetchError } = await supabase
      .from('update_comments')
      .select(`
        *,
        user:users(id, full_name, email, role)
      `)
      .eq('update_id', updateId)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching comments:', fetchError)
      return { success: false, error: 'فشل في جلب التعليقات' }
    }

    return { success: true, data: comments || [] }
  } catch (error: any) {
    console.error('Error in getUpdateComments:', error)
    return { success: false, error: error.message || 'حدث خطأ غير متوقع' }
  }
}
