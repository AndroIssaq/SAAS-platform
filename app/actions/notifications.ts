'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentAccountId } from '@/lib/actions/account'

/**
 * Server Action: Send Contract Notification
 * Creates an in-app notification for the user
 */
export async function sendContractNotification(data: {
  userId: string
  contractId: string
  contractNumber: string
  type: 'contract_created' | 'contract_created_admin' | 'contract_created_affiliate' | 'payment_approved' | 'payment_rejected' | 'contract_finalized' | 'step_completed'
  customMessage?: string
}) {
  try {
    const supabase = await createClient()

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('account_id')
      .eq('id', data.contractId)
      .single()

    if (contractError || !contract?.account_id) {
      console.error('Error fetching contract for notification:', contractError)
      return { success: false, error: 'فشل في إنشاء الإشعار' }
    }

    // Notification messages based on type
    const messages = {
      contract_created: {
        title: '🎉 عقد جديد في انتظارك',
        message: `عقد رقم ${data.contractNumber} - يرجى المراجعة والتوقيع`
      },
      contract_created_admin: {
        title: '✅ تم إنشاء عقح جديد',
        message: `عقد رقم ${data.contractNumber} - في انتظار موافقتك`
      },
      contract_created_affiliate: {
        title: '🤝 عقد جديد من إحالتك',
        message: `عقد رقم ${data.contractNumber} - يرجى المراجعة والموافقة`
      },
      payment_approved: {
        title: '✅ تم قبول إثبات الدفع',
        message: `تم الموافقة على إثبات الدفع للعقد ${data.contractNumber}`
      },
      payment_rejected: {
        title: '❌ تم رفض إثبات الدفع',
        message: data.customMessage || `تم رفض إثبات الدفع للعقد ${data.contractNumber}. يرجى رفع إثبات جديد`
      },
      contract_finalized: {
        title: '🎊 تم إتمام العقد',
        message: `تم إنهاء العقد ${data.contractNumber} بنجاح. يمكنك تحميل النسخة النهائية`
      },
      step_completed: {
        title: '✓ تم إكمال خطوة',
        message: data.customMessage || `تم تحديث حالة العقد ${data.contractNumber}`
      }
    }

    const notificationData = messages[data.type]

    const { error } = await supabase.from('notifications').insert({
      account_id: contract.account_id,
      user_id: data.userId,
      type: data.type,
      title: notificationData.title,
      message: notificationData.message,
      link: `/client/contracts/${data.contractId}`,
      related_id: data.contractId,
      status: 'sent',
      read: false,
      data: {
        contract_id: data.contractId,
        contract_number: data.contractNumber,
        notification_type: data.type
      }
    })

    if (error) {
      console.error('Error creating notification:', error)
      return { success: false, error: error.message }
    }

    // Revalidate notifications page
    revalidatePath('/client/notifications')

    return { success: true }
  } catch (error) {
    console.error('Error in sendContractNotification:', error)
    return { success: false, error: 'فشل في إرسال الإشعار' }
  }
}

/**
 * Server Action: Mark Notification as Read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/client/notifications')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'فشل في تحديث الإشعار' }
  }
}

/**
 * Server Action: Get User Notifications
 */
export async function getUserNotifications(userId: string, limit = 50) {
  try {
    const supabase = await createClient()
    const accountId = await getCurrentAccountId()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'فشل في جلب الإشعارات' }
  }
}

/**
 * Server Action: Get Unread Notifications Count
 */
export async function getUnreadNotificationsCount(userId: string) {
  try {
    const supabase = await createClient()
    const accountId = await getCurrentAccountId()

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { count, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    return { success: false, error: 'فشل في جلب عدد الإشعارات' }
  }
}

/**
 * Server Action: Delete Notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/client/notifications')
    revalidatePath('/admin/notifications')
    revalidatePath('/affiliate/notifications')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'فشل في حذف الإشعار' }
  }
}

/**
 * Server Action: Clear All Notifications
 */
export async function clearAllNotifications(userId: string) {
  try {
    const supabase = await createClient()
    const accountId = await getCurrentAccountId()

    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/client/notifications')
    revalidatePath('/admin/notifications')
    revalidatePath('/affiliate/notifications')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'فشل في مسح جميع الإشعارات' }
  }
}

/**
 * Server Action: Clear Read Notifications
 */
export async function clearReadNotifications(userId: string) {
  try {
    const supabase = await createClient()
    const accountId = await getCurrentAccountId()

    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true)

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/client/notifications')
    revalidatePath('/admin/notifications')
    revalidatePath('/affiliate/notifications')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'فشل في مسح الإشعارات المقروءة' }
  }
}
