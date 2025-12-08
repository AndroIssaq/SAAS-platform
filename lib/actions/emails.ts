'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { getEmailLogs as getRawEmailLogs } from '@/lib/actions/email-logs'

const resend = new Resend(process.env.RESEND_API_KEY)

import { decrypt } from '@/lib/encryption'
import { getCurrentAccountId } from '@/lib/actions/account'
import { getAllClients } from '@/lib/actions/admin'

export async function getAllUsers() {
  // We delegate to getAllClients because it already contains the robust logic 
  // for finding clients via Contracts, Account ID, or Created By, 
  // AND it handles the "Mock User" creation with decrypted data for manual clients.
  const { data: clients, error } = await getAllClients()

  if (error || !clients) {
    console.error('Error fetching clients for emails:', error)
    return []
  }

  // Map clients to the User format expected by the composer
  // getAllClients returns { users: ... } inside each client object
  const mappedUsers = clients.map((client: any) => {
    // getAllClients ensures client.users is populated (mocked or real)
    const user = client.users
    if (!user) return null

    // Ensure we have at least an email or name to show
    if ((!user.email || user.email === '-') && (!user.full_name)) return null

    // If email is mocked as '-', we can't send email, but we might show them?
    // For email composer, we need valid email.
    if (!user.email || user.email === '-' || !user.email.includes('@')) return null

    return {
      id: user.id || client.id,
      email: user.email,
      full_name: user.full_name || 'Client',
      role: user.role || 'client',
      status: 'active',
    }
  }).filter(Boolean)

  // Dedup by email to avoid showing the same person multiple times if they have multiple client records
  const seen = new Set()
  return mappedUsers.filter((u: any) => {
    const duplicate = seen.has(u.email)
    seen.add(u.email)
    return !duplicate
  })
}

interface SendEmailParams {
  to: string[]
  subject: string
  message: string
}

export async function sendEmail({ to, subject, message }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'مفتاح Resend غير مُعد في متغيرات البيئة' }
  }

  if (!to || to.length === 0) {
    return { success: false, error: 'لا يوجد مستلمين لإرسال البريد إليهم' }
  }

  const supabase = await createClient()

  const results: { recipient: string; success: boolean; error?: string }[] = []

  for (const recipient of to) {
    try {
      const { data: emailResult, error } = await resend.emails.send({
        from: 'عَقدي <no-reply@roboweb.sa>',
        to: recipient,
        subject,
        html: `<!DOCTYPE html>
<html dir="rtl">
  <head>
    <meta charSet="UTF-8" />
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
      <h1 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; color: #111827;">رسالة جديدة من عَقدي</h1>
      <div style="font-size: 14px; line-height: 1.8; color: #374151; white-space: pre-line;">
        ${message.replace(/\n/g, '<br />')}
      </div>
      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">هذه الرسالة أُرسلت عبر نظام البريد في لوحة تحكم عَقدي.</p>
    </div>
  </body>
</html>`,
      })

      if (error) {
        await supabase.from('email_logs').insert({
          recipient,
          subject,
          status: 'failed',
          error_message: error.message,
          metadata: { message },
        })

        results.push({ recipient, success: false, error: error.message })
      } else {
        await supabase.from('email_logs').insert({
          recipient,
          subject,
          status: 'sent',
          email_id: emailResult?.id,
          metadata: { message },
        })

        results.push({ recipient, success: true })
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error'

      await supabase.from('email_logs').insert({
        recipient,
        subject,
        status: 'failed',
        error_message: errorMessage,
        metadata: { message },
      })

      results.push({ recipient, success: false, error: errorMessage })
    }
  }

  const failed = results.filter((r) => !r.success)

  if (failed.length > 0) {
    // If sending to a single recipient, surface the exact error message
    if (to.length === 1 && failed[0]?.error) {
      return {
        success: false,
        error: failed[0].error,
      }
    }

    return {
      success: false,
      error: `فشل إرسال البريد إلى ${failed.length} من ${to.length} مستلم`,
    }
  }

  return { success: true }
}

export async function getEmailLogs(limit = 100) {
  const result = await getRawEmailLogs(limit)

  if (!result.success || !result.data) {
    return []
  }

  return result.data.map((log: any) => ({
    id: log.id,
    recipient_email: log.recipient,
    subject: log.subject,
    message: log.metadata?.message ?? '',
    status: log.status,
    error_message: log.error_message ?? null,
    sent_at: log.created_at,
  }))
}
