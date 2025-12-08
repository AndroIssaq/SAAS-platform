'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/actions/emails'
import { getCurrentAccountId } from '@/lib/actions/account'
import type { FormConfig, FormRecord } from '@/lib/types/forms'

function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 32) || 'form'
}

function generateFormKey(title: string) {
  const base = slugifyTitle(title)
  const random = Math.random().toString(36).slice(2, 6)
  return `${base}-${random}`
}

import { requireActiveSubscription } from '@/lib/actions/subscription-guard'

export async function createForm({
  title,
  description,
  config,
}: {
  title: string
  description?: string
  config: FormConfig
}): Promise<{ success: boolean; id?: string; formKey?: string; error?: string }> {
  await requireActiveSubscription() // Security Check

  try {
    const supabase = await createClient()
    const accountId = await getCurrentAccountId()
    const { data: { user } } = await supabase.auth.getUser()

    if (!accountId || !user) {
      return { success: false, error: 'لم يتم العثور على حساب مرتبط' }
    }

    const formKey = generateFormKey(title)

    const { data, error } = await supabase
      .from('forms')
      .insert({
        form_key: formKey,
        title,
        description: description || null,
        config,
        account_id: accountId,
        user_id: user.id
      })
      .select('id, form_key')
      .single()

    if (error || !data) {
      console.error('Error creating form:', error)
      return { success: false, error: 'فشل في إنشاء الفورم' }
    }

    return { success: true, id: data.id, formKey: data.form_key }
  } catch (err: any) {
    console.error('Unexpected error in createForm:', err)
    return { success: false, error: err?.message || 'حدث خطأ غير متوقع' }
  }
}

export async function deleteFormById(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting form:', error)
      return { success: false, error: 'فشل في حذف الفورم' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error in deleteFormById:', err)
    return { success: false, error: err?.message || 'حدث خطأ غير متوقع' }
  }
}

export async function getFormByKey(formKey: string): Promise<{ success: boolean; form?: FormRecord; error?: string }> {
  try {
    const supabase = createAdminClient()

    let decodedKey = formKey
    try {
      decodedKey = decodeURIComponent(formKey)
    } catch {
      // ignore decode errors
    }

    let data, error

    // 1. If it looks like a UUID, try to find by ID first
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedKey)

    if (isUUID) {
      const { data: byId, error: errorById } = await supabase
        .from('forms')
        .select('*')
        .eq('id', decodedKey)
        .single()

      if (byId && !errorById) {
        return { success: true, form: byId as unknown as FormRecord }
      }
    }

    // 2. Try to find by form_key (slug)
    const result = await supabase
      .from('forms')
      .select('*')
      .eq('form_key', decodedKey)
      .single()

    data = result.data
    error = result.error

    if (error || !data) {
      if (error) {
        console.error('Error fetching form by key from Supabase:', { formKey, error })
      } else {
        console.warn('No form found for formKey:', formKey)
      }
      return { success: false, error: 'الفورم غير موجودة' }
    }

    return { success: true, form: data as unknown as FormRecord }
  } catch (err: any) {
    console.error('Unexpected error in getFormByKey:', err)
    return { success: false, error: err?.message || 'حدث خطأ غير متوقع' }
  }
}

export async function getFormById(id: string): Promise<{ success: boolean; form?: FormRecord; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return { success: false, error: 'الفورم غير موجودة' }
    }

    return { success: true, form: data as unknown as FormRecord }
  } catch (err: any) {
    console.error('Unexpected error in getFormById:', err)
    return { success: false, error: err?.message || 'حدث خطأ غير متوقع' }
  }
}

export async function getAllForms(): Promise<{ success: boolean; forms: FormRecord[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      return { success: false, forms: [], error: 'فشل في جلب الفورمز' }
    }

    return { success: true, forms: data as unknown as FormRecord[] }
  } catch (err: any) {
    console.error('Unexpected error in getAllForms:', err)
    return { success: false, forms: [], error: err?.message || 'حدث خطأ غير متوقع' }
  }
}

export async function updateForm({
  id,
  title,
  description,
  config,
}: {
  id: string
  title: string
  description?: string
  config: FormConfig
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('forms')
      .update({
        title,
        description: description || null,
        config,
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating form:', error)
      return { success: false, error: 'فشل في تحديث الفورم' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error in updateForm:', err)
    return { success: false, error: err?.message || 'حدث خطأ غير متوقع' }
  }
}

export interface FormSubmissionRecord {
  id: string
  form_id: string
  email: string | null
  data: Record<string, any>
  source_url: string | null
  created_at: string
  form: {
    title: string
    form_key: string
  }
}

export async function getFormSubmissions(): Promise<{
  success: boolean
  submissions: FormSubmissionRecord[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // 1. Fetch submissions - use * to get all available columns dynamically
    // This avoids errors when columns don't exist
    const { data: submissions, error } = await supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !submissions) {
      console.error('Error fetching form submissions:', error)
      return { success: false, submissions: [], error: 'فشل في جلب بيانات الـ signups' }
    }

    // 2. Fetch related forms manually
    const formIds = [...new Set(submissions.map(s => s.form_id))]
    let formsMap = new Map()

    if (formIds.length > 0) {
      const { data: forms } = await supabase
        .from('forms')
        .select('id, title, form_key')
        .in('id', formIds)

      if (forms) {
        forms.forEach(f => formsMap.set(f.id, f))
      }
    }

    // 3. Merge data and extract email from data object
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const mergedData = submissions.map((sub: any) => {
      // Try to extract email from data object
      let extractedEmail: string | null = null
      if (sub.data && typeof sub.data === 'object') {
        const keys = Object.keys(sub.data)
        for (const key of keys) {
          const lowerKey = key.toLowerCase()
          if (lowerKey.includes('email') || lowerKey.includes('mail') || lowerKey.includes('بريد')) {
            const val = sub.data[key]
            if (typeof val === 'string' && emailRegex.test(val)) {
              extractedEmail = val.trim()
              break
            }
          }
        }
        // Fallback: check all values
        if (!extractedEmail) {
          for (const val of Object.values(sub.data)) {
            if (typeof val === 'string' && emailRegex.test(val)) {
              extractedEmail = val.trim()
              break
            }
          }
        }
      }

      return {
        ...sub,
        email: extractedEmail,
        source_url: sub.source_url || null, // May not exist in DB
        form: formsMap.get(sub.form_id) || { title: 'Unknown Form', form_key: '' }
      }
    })

    return { success: true, submissions: mergedData as unknown as FormSubmissionRecord[] }
  } catch (err: any) {
    console.error('Unexpected error in getFormSubmissions:', err)
    return { success: false, submissions: [], error: err?.message || 'حدث خطأ غير متوقع' }
  }
}

export async function deleteFormSubmission(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('form_submissions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting form submission:', error)
      return { success: false, error: 'فشل في حذف الـ signup' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error in deleteFormSubmission:', err)
    return { success: false, error: err?.message || 'حدث خطأ غير متوقع' }
  }
}

export async function getEmailsForForm(formKey: string): Promise<{
  success: boolean
  emails: string[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    let decodedKey = formKey
    try {
      decodedKey = decodeURIComponent(formKey)
    } catch {
      // ignore decode errors
    }

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, form_key')
      .eq('form_key', decodedKey)
      .single()

    if (formError || !form) {
      console.error('Error fetching form for getEmailsForForm:', { formKey, formError })
      return { success: false, emails: [], error: 'الفورم غير موجودة' }
    }

    const { data: submissions, error: submissionsError } = await supabase
      .from('form_submissions')
      .select('email, data')
      .eq('form_id', form.id)

    if (submissionsError || !submissions) {
      console.error('Error fetching form emails:', submissionsError)
      return { success: false, emails: [], error: 'فشل في جلب الإيميلات لهذه الفورم' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const emails = Array.from(
      new Set(
        submissions
          .map((row: any) => {
            // 1. Try explicit column
            if (row.email && typeof row.email === 'string' && row.email.trim()) {
              return row.email.trim()
            }

            // 2. Try looking in data object
            if (row.data && typeof row.data === 'object') {
              // Check common keys likely to be email
              const keys = Object.keys(row.data);
              for (const key of keys) {
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('email') || lowerKey.includes('mail') || lowerKey.includes('بريد')) {
                  const val = row.data[key];
                  if (typeof val === 'string' && emailRegex.test(val)) {
                    return val.trim();
                  }
                }
              }

              // Fallback: check ALL values
              for (const val of Object.values(row.data)) {
                if (typeof val === 'string' && emailRegex.test(val)) {
                  return val.trim();
                }
              }
            }
            return ''
          })
          .filter((email: string) => email.length > 0),
      ),
    )

    return { success: true, emails }
  } catch (err: any) {
    console.error('Unexpected error in getEmailsForForm:', err)
    return { success: false, emails: [], error: err?.message || 'حدث خطأ غير متوقع' }
  }
}

export async function sendEmailToFormSignups({
  formKey,
  subject,
  message,
}: {
  formKey: string
  subject: string
  message: string
}): Promise<{ success: boolean; sentCount?: number; error?: string }> {
  try {
    const { success, emails, error } = await getEmailsForForm(formKey)

    if (!success || !emails.length) {
      return {
        success: false,
        error: error || 'لا يوجد إيميلات مرتبطة بهذه الفورم',
      }
    }

    const result = await sendEmail({
      to: emails,
      subject,
      message,
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'فشل في إرسال الإيميلات',
      }
    }

    return {
      success: true,
      sentCount: emails.length,
    }
  } catch (err: any) {
    console.error('Unexpected error in sendEmailToFormSignups:', err)
    return { success: false, error: err?.message || 'حدث خطأ غير متوقع' }
  }
}

// Send bulk email to selected leads by their emails
export async function sendBulkEmailToLeads({
  emails,
  subject,
  message,
}: {
  emails: string[]
  subject: string
  message: string
}): Promise<{ success: boolean; sentCount?: number; error?: string }> {
  try {
    if (!emails || emails.length === 0) {
      return { success: false, error: 'لم يتم تحديد أي إيميلات' }
    }

    if (!subject || !subject.trim()) {
      return { success: false, error: 'عنوان الرسالة مطلوب' }
    }

    if (!message || !message.trim()) {
      return { success: false, error: 'محتوى الرسالة مطلوب' }
    }

    // Filter valid emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmails = emails.filter(email => emailRegex.test(email))

    if (validEmails.length === 0) {
      return { success: false, error: 'لا يوجد إيميلات صالحة' }
    }

    const result = await sendEmail({
      to: validEmails,
      subject: subject.trim(),
      message: message.trim(),
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'فشل في إرسال الإيميلات',
      }
    }

    return {
      success: true,
      sentCount: validEmails.length,
    }
  } catch (err: any) {
    console.error('Unexpected error in sendBulkEmailToLeads:', err)
    return { success: false, error: err?.message || 'حدث خطأ غير متوقع' }
  }
}
