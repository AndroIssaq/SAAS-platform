'use server'

/**
 * Subscription Email Notifications
 * Sends email reminders for trial expiry and subscription events
 */

import { createAdminClient } from '@/lib/supabase/admin'

const TRIAL_WARNING_DAYS = 3

interface EmailData {
    to: string
    subject: string
    html: string
}

/**
 * Check and send trial expiry warnings
 * Should be called by a cron job daily
 */
export async function sendTrialExpiryWarnings(): Promise<{ sent: number; errors: number }> {
    const { adminClient } = await createAdminClient()

    let sent = 0
    let errors = 0

    // Calculate the date that is TRIAL_WARNING_DAYS from now
    const warningDate = new Date()
    warningDate.setDate(warningDate.getDate() - (14 - TRIAL_WARNING_DAYS))

    // Find accounts where trial started exactly (14 - WARNING_DAYS) days ago
    // This means they have WARNING_DAYS left
    const startOfDay = new Date(warningDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(warningDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: accounts } = await adminClient
        .from('accounts')
        .select(`
      id,
      name,
      owner_user_id,
      trial_started_at,
      subscription_status,
      users!accounts_owner_user_id_fkey(email, full_name)
    `)
        .eq('subscription_status', 'trial')
        .gte('trial_started_at', startOfDay.toISOString())
        .lte('trial_started_at', endOfDay.toISOString())

    if (!accounts || accounts.length === 0) {
        console.log('[TrialWarning] No accounts need warning today')
        return { sent: 0, errors: 0 }
    }

    for (const account of accounts) {
        try {
            const user = account.users as any
            if (!user?.email) continue

            const email = buildTrialWarningEmail({
                accountName: account.name,
                userName: user.full_name || 'عزيزي العميل',
                daysRemaining: TRIAL_WARNING_DAYS,
            })

            // Send email via your email service
            // For now, we'll just log it
            console.log(`[TrialWarning] Would send email to ${user.email}:`, email.subject)

            // TODO: Integrate with your email service (Resend, SendGrid, etc.)
            // await sendEmail({ to: user.email, ...email })

            sent++
        } catch (error) {
            console.error(`[TrialWarning] Error sending to account ${account.id}:`, error)
            errors++
        }
    }

    return { sent, errors }
}

/**
 * Build trial warning email content
 */
function buildTrialWarningEmail(data: {
    accountName: string
    userName: string
    daysRemaining: number
}): EmailData {
    return {
        to: '', // Filled by caller
        subject: `⚠️ تبقى ${data.daysRemaining} أيام فقط على انتهاء الفترة التجريبية - عَقدي`,
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تنبيه انتهاء الفترة التجريبية</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ تنبيه هام</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
        مرحباً <strong>${data.userName}</strong>،
      </p>
      
      <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 16px; color: #92400e;">
          <strong>تبقى ${data.daysRemaining} أيام فقط</strong> على انتهاء الفترة التجريبية المجانية لحساب "${data.accountName}".
        </p>
      </div>
      
      <p style="color: #666; line-height: 1.6;">
        بعد انتهاء الفترة التجريبية، لن تتمكن من الوصول لـ:
      </p>
      
      <ul style="color: #666; line-height: 1.8;">
        <li>إدارة العقود والعملاء</li>
        <li>نماذج جمع العملاء (Lead Gen)</li>
        <li>إرسال البريد الإلكتروني</li>
        <li>نظام الشركاء والعمولات</li>
        <li>جميع ميزات المنصة الأخرى</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://your-domain.com/admin/subscription" 
           style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 15px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
          🚀 اشترك الآن واحتفظ ببياناتك
        </a>
      </div>
      
      <p style="color: #888; font-size: 14px; text-align: center;">
        الأسعار تبدأ من <strong>299 جنيه/شهر</strong> فقط
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #888; font-size: 12px; margin: 0;">
        © 2024 عَقدي - جميع الحقوق محفوظة
      </p>
    </div>
    
  </div>
</body>
</html>
    `.trim(),
    }
}

/**
 * Send subscription activated email
 */
export async function sendSubscriptionActivatedEmail(data: {
    email: string
    userName: string
    planName: string
}): Promise<boolean> {
    const emailContent: EmailData = {
        to: data.email,
        subject: `✅ تم تفعيل اشتراكك في عَقدي - ${data.planName}`,
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">✅ تم تفعيل اشتراكك!</h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="font-size: 18px; color: #333;">
        مرحباً <strong>${data.userName}</strong>،
      </p>
      
      <div style="background: #dcfce7; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 18px; color: #166534; font-weight: bold;">
          ${data.planName}
        </p>
        <p style="margin: 10px 0 0; color: #15803d;">
          اشتراكك الآن فعال ويمكنك استخدام جميع ميزات المنصة
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://your-domain.com/admin/dashboard" 
           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 15px 40px; border-radius: 10px; text-decoration: none; font-weight: bold;">
          انطلق للوحة التحكم
        </a>
      </div>
      
      <p style="color: #666; text-align: center;">
        شكراً لثقتك بنا! 💚
      </p>
    </div>
    
  </div>
</body>
</html>
    `.trim(),
    }

    console.log(`[SubscriptionEmail] Would send activation email to ${data.email}`)
    // TODO: Integrate with email service
    // await sendEmail(emailContent)

    return true
}
