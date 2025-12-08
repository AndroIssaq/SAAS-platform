/**
 * Messages Actions - Stub file for backward compatibility
 * 
 * These actions are placeholders until proper implementation
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentAccountId } from '@/lib/actions/account'
import { requireActiveSubscription } from '@/lib/actions/subscription-guard'

export async function sendMessage(data: any) {
  await requireActiveSubscription() // Security Check

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح' }
  }

  const accountId = await getCurrentAccountId()

  if (!accountId) {
    return { success: false, error: 'لم يتم العثور على حساب مرتبط بالمستخدم.' }
  }

  const { error } = await supabase.from('messages').insert({
    account_id: accountId,
    sender_id: user.id,
    receiver_id: data.receiverId,
    subject: data.subject,
    message: data.message,
    related_contract_id: data.contractId
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function markMessageAsRead(messageId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح' }
  }

  const accountId = await getCurrentAccountId()

  let query = supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('receiver_id', user.id)

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getMessages(userId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح', data: [] }
  }

  const targetUserId = userId || user.id

  const accountId = await getCurrentAccountId()

  // Fetch messages
  let query = supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`)
    .order('created_at', { ascending: false })

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data: messages, error } = await query

  if (error) {
    console.error('Error fetching messages:', error)
    return { success: false, error: error.message, data: [] }
  }

  if (!messages || messages.length === 0) {
    return { success: true, data: [] }
  }

  // Get unique user IDs
  const userIds = new Set<string>()
  messages.forEach(msg => {
    userIds.add(msg.sender_id)
    userIds.add(msg.receiver_id)
  })

  // Fetch user data
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .in('id', Array.from(userIds))

  // Create user map
  const userMap = new Map(users?.map(u => [u.id, u]) || [])

  // Attach user data to messages
  const messagesWithUsers = messages.map(msg => ({
    ...msg,
    sender: userMap.get(msg.sender_id),
    receiver: userMap.get(msg.receiver_id),
  }))

  return { success: true, data: messagesWithUsers }
}

export async function getConversation(userId: string, otherUserId: string) {
  const supabase = await createClient()
  const accountId = await getCurrentAccountId()

  let query = supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data }
}
