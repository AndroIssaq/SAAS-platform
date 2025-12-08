'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Server Action: Send Contract Activation Email
 * Used when a new client account is provisioned via a contract and needs to set a password
 */
export async function sendContractActivationEmail(data: {
  to: string
  clientName: string
  contractNumber: string
  contractId: string
  activationToken: string
}) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const activationUrl = `${baseUrl}/auth/activate?token=${encodeURIComponent(
      data.activationToken,
    )}&email=${encodeURIComponent(data.to)}`
    const dashboardUrl = `${baseUrl}/auth/login`
    const contractUrl = `${baseUrl}/client/contracts/${data.contractId}`

    // Log email preview for local/dev environments (useful when no domain is configured)
    console.log('[DEV-EMAIL][Activation]', {
      to: data.to,
      clientName: data.clientName,
      contractNumber: data.contractNumber,
      activationUrl,
      dashboardUrl,
      contractUrl,
    })

    const { error } = await resend.emails.send({
      from: 'عَقدي <contracts@roboweb.sa>',
      to: data.to,
      subject: `تم توقيع عقدك - فعّل حسابك الآن (${data.contractNumber})`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 640px; margin: 40px auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: 800; color: #0ea271; }
            .subtitle { font-size: 16px; color: #6b7280; margin-top: 8px; }
            .contract-card { background: linear-gradient(135deg, #0ea271 0%, #0b7f5a 100%); color: white; padding: 24px; border-radius: 12px; text-align: center; margin: 30px 0; }
            .contract-number { font-size: 24px; font-weight: 700; letter-spacing: 1px; margin-top: 8px; }
            .cta { text-align: center; margin: 30px 0; }
            .cta-button { display: inline-block; background: #0ea271; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35); }
            .cta-button:hover { background: #0b7f5a; }
            .secondary-link { font-size: 13px; color: #6b7280; margin-top: 8px; }
            .secondary-link a { color: #0ea271; text-decoration: none; }
            .info { background: #f9fafb; border-radius: 12px; padding: 16px 20px; font-size: 14px; color: #4b5563; margin-top: 8px; }
            .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 عَقدي</div>
              <div class="subtitle">تم توقيع عقدك بنجاح، قم بتفعيل حسابك للوصول إلى لوحة التحكم والعقد في أي وقت</div>
            </div>
            <p style="font-size: 15px; color: #374151; line-height: 1.7;">
              مرحباً <strong>${data.clientName}</strong>,
            </p>
            <p style="font-size: 15px; color: #374151; line-height: 1.7;">
              تم توقيع عقدك رقم <strong>${data.contractNumber}</strong>. قم الآن بتعيين كلمة مرور لحسابك لمراجعة العقد ومتابعة حالة مشروعك من لوحة التحكم الخاصة بالعملاء.
            </p>
            <div class="contract-card">
              <div>رقم العقد</div>
              <div class="contract-number">${data.contractNumber}</div>
            </div>
            <div class="cta">
              <a href="${activationUrl}" class="cta-button">تعيين كلمة المرور وتفعيل الحساب</a>
              <div class="secondary-link">
                بعد التفعيل يمكنك تسجيل الدخول من هنا:
                <a href="${dashboardUrl}">${dashboardUrl}</a>
              </div>
            </div>
            <div class="info">
              <strong>ملاحظة أمنية:</strong>
              <p style="margin-top: 4px;">
                لن نطلب منك أبداً مشاركة كلمة المرور عبر البريد الإلكتروني. إذا لم تكن تتوقع هذه الرسالة، يمكنك تجاهلها بأمان.
              </p>
              <p style="margin-top: 8px;">
                يمكنك أيضاً الوصول إلى العقد مباشرة بعد تسجيل الدخول من خلال صفحة العقود:
                <a href="${contractUrl}" style="color: #0ea271; text-decoration: none;">${contractUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>© 2025 عَقدي – منصة إدارة العقود والمشاريع.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Error sending activation email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('sendContractActivationEmail error:', error)
    return { success: false, error: 'فشل في إرسال بريد تفعيل الحساب' }
  }
}

/**
 * Server Action: Send Contract Creation Email
 * Sends email to client when contract is created
 */
export async function sendContractEmail(data: {
  to: string
  clientName: string
  contractNumber: string
  contractId: string
  serviceType: string
  totalAmount: number
}) {
  try {
    const contractUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/client/contracts/${data.contractId}`

    // Log email preview for local/dev environments (useful when no domain is configured)
    console.log('[DEV-EMAIL][ContractCreated]', {
      to: data.to,
      clientName: data.clientName,
      contractNumber: data.contractNumber,
      contractId: data.contractId,
      contractUrl,
      totalAmount: data.totalAmount,
      serviceType: data.serviceType,
    })

    const { data: emailResult, error } = await resend.emails.send({
      from: 'عَقدي <contracts@roboweb.sa>',
      to: data.to,
      subject: `عقد جديد في انتظارك - ${data.contractNumber}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #0ea271;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #0ea271;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              color: #1f2937;
              margin: 20px 0;
            }
            .contract-card {
              background: linear-gradient(135deg, #0ea271 0%, #0b7f5a 100%);
              color: white;
              padding: 30px;
              border-radius: 10px;
              margin: 30px 0;
              text-align: center;
            }
            .contract-number {
              font-size: 28px;
              font-weight: bold;
              margin: 15px 0;
              letter-spacing: 2px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 15px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-label {
              color: #6b7280;
              font-weight: 500;
            }
            .info-value {
              color: #1f2937;
              font-weight: 600;
            }
            .cta-button {
              display: inline-block;
              background: #0ea271;
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-size: 18px;
              font-weight: bold;
              margin: 30px auto;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
              transition: all 0.3s;
            }
            .cta-button:hover {
              background: #0b7f5a;
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
            }
            .steps-container {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .step {
              display: flex;
              align-items: center;
              padding: 10px 0;
            }
            .step-number {
              background: #0ea271;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              margin-left: 15px;
            }
            .warning-box {
              background: #fef3c7;
              border-right: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 13px;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 عَقدي</div>
              <div class="title">عقد جديد في انتظارك</div>
            </div>
            
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              مرحباً <strong>${data.clientName}</strong>،
            </p>
            
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              تم إنشاء عقد جديد لك من قبل فريق عَقدي. يرجى مراجعة تفاصيل العقد وإكمال الخطوات المطلوبة.
            </p>

            <div class="contract-card">
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">رقم العقد</p>
              <div class="contract-number">${data.contractNumber}</div>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">${data.serviceType}</p>
            </div>

            <div style="margin: 30px 0;">
              <div class="info-row">
                <span class="info-label">نوع الخدمة</span>
                <span class="info-value">${data.serviceType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">المبلغ الإجمالي</span>
                <span class="info-value">${data.totalAmount.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div class="info-row" style="border: none;">
                <span class="info-label">الحالة</span>
                <span class="info-value" style="color: #f59e0b;">⏳ في انتظار الإجراءات</span>
              </div>
            </div>

            <div class="steps-container">
              <h3 style="margin-top: 0; color: #1f2937;">الخطوات المطلوبة:</h3>
              <div class="step">
                <div class="step-number">4</div>
                <span>رفع صورة الهوية الوطنية</span>
              </div>
              <div class="step">
                <div class="step-number">5</div>
                <span>التحقق عبر رمز OTP</span>
              </div>
              <div class="step">
                <div class="step-number">6</div>
                <span>رفع إثبات الدفع</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${contractUrl}" class="cta-button">
                📄 عرض العقد وإكمال الخطوات
              </a>
            </div>

            <div class="warning-box">
              <strong>⚠️ ملاحظة مهمة:</strong>
              <p style="margin: 5px 0 0 0; font-size: 14px;">
                يجب إكمال جميع الخطوات المطلوبة للموافقة على العقد وبدء العمل. في حال واجهت أي مشكلة، يرجى التواصل مع فريق الدعم.
              </p>
            </div>

            <div class="footer">
              <p>هذه رسالة تلقائية من نظام عَقدي</p>
              <p>© 2025 عَقدي. جميع الحقوق محفوظة.</p>
              <p style="margin-top: 10px;">
                <a href="${contractUrl}" style="color: #0ea271; text-decoration: none;">عرض العقد</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)

      // Log email failure to database
      const supabase = await createClient()

      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('account_id')
        .eq('id', data.contractId)
        .single()

      await supabase.from('email_logs').insert({
        account_id: contract?.account_id,
        recipient: data.to,
        subject: `عقد جديد في انتظارك - ${data.contractNumber}`,
        status: 'failed',
        error_message: error.message,
        metadata: { contract_id: data.contractId }
      })

      return { success: false, error: error.message }
    }

    // Log successful email
    const supabase = await createClient()

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('account_id')
      .eq('id', data.contractId)
      .single()

    await supabase.from('email_logs').insert({
      account_id: contract?.account_id,
      recipient: data.to,
      subject: `عقد جديد في انتظارك - ${data.contractNumber}`,
      status: 'sent',
      email_id: emailResult?.id,
      metadata: { contract_id: data.contractId }
    })

    return { success: true, emailId: emailResult?.id }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: 'فشل في إرسال البريد الإلكتروني' }
  }
}

/**
 * Server Action: Send Payment Approval Email
 */
export async function sendPaymentApprovalEmail(data: {
  to: string
  clientName: string
  contractNumber: string
  contractId: string
  amount: number
}) {
  try {
    const contractUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/client/contracts/${data.contractId}`

    const { error } = await resend.emails.send({
      from: 'عَقدي <contracts@roboweb.sa>',
      to: data.to,
      subject: `✅ تم قبول إثبات الدفع - ${data.contractNumber}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .success-badge { background: linear-gradient(135deg, #0ea271 0%, #0b7f5a 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .cta-button { display: inline-block; background: #0ea271; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 style="color: #0ea271; text-align: center;">✅ تم قبول الدفع</h1>
            <p>مرحباً ${data.clientName},</p>
            <div class="success-badge">
              <h2 style="margin: 0;">تم الموافقة على إثبات الدفع</h2>
              <p style="font-size: 24px; margin: 15px 0;">العقد ${data.contractNumber}</p>
              <p style="margin: 0;">المبلغ: ${data.amount.toLocaleString('ar-EG')} ج.م</p>
            </div>
            <p>تم مراجعة والموافقة على إثبات الدفع الخاص بك. سيتم الآن البدء في تنفيذ المشروع.</p>
            <div style="text-align: center;">
              <a href="${contractUrl}" class="cta-button">عرض العقد النهائي</a>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Error sending approval email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'فشل في إرسال البريد الإلكتروني' }
  }
}

/**
 * Server Action: Send Payment Rejection Email
 */
export async function sendPaymentRejectionEmail(data: {
  to: string
  clientName: string
  contractNumber: string
  contractId: string
  rejectionReason: string
}) {
  try {
    const contractUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/client/contracts/${data.contractId}`

    const { error } = await resend.emails.send({
      from: 'عَقدي <contracts@roboweb.sa>',
      to: data.to,
      subject: `❌ تنبيه: إثبات الدفع يحتاج مراجعة - ${data.contractNumber}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .warning-badge { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px; margin: 20px 0; }
            .reason-box { background: #fef3c7; border-right: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .cta-button { display: inline-block; background: #f59e0b; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 style="color: #f59e0b; text-align: center;">⚠️ يحتاج إثبات الدفع إلى مراجعة</h1>
            <p>مرحباً ${data.clientName},</p>
            <div class="warning-badge">
              <h2 style="margin: 0;">إثبات الدفع يحتاج تعديل</h2>
              <p style="font-size: 20px; margin: 10px 0;">العقد ${data.contractNumber}</p>
            </div>
            <div class="reason-box">
              <strong>سبب الرفض:</strong>
              <p style="margin: 10px 0 0 0; font-size: 15px;">${data.rejectionReason}</p>
            </div>
            <p>يرجى رفع إثبات دفع جديد بعد مراعاة الملاحظات أعلاه.</p>
            <div style="text-align: center;">
              <a href="${contractUrl}" class="cta-button">رفع إثبات جديد</a>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Error sending rejection email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'فشل في إرسال البريد الإلكتروني' }
  }
}

/**
 * Server Action: Send Contract Finalized Email
 * Notifies client that the contract has been fully completed and provides links
 */
export async function sendContractFinalizedEmail(data: {
  to: string
  clientName: string
  contractNumber: string
  contractId: string
}) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const contractUrl = `${baseUrl}/client/contracts/${data.contractId}`
    const dashboardUrl = `${baseUrl}/client/dashboard`

    // Log email preview for local/dev environments
    console.log('[DEV-EMAIL][ContractFinalized]', {
      to: data.to,
      clientName: data.clientName,
      contractNumber: data.contractNumber,
      contractId: data.contractId,
      contractUrl,
      dashboardUrl,
    })

    const { error } = await resend.emails.send({
      from: 'عَقدي <contracts@roboweb.sa>',
      to: data.to,
      subject: `تم إتمام عقدك بنجاح - ${data.contractNumber}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 640px; margin: 40px auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: 800; color: #0ea271; }
            .subtitle { font-size: 16px; color: #6b7280; margin-top: 8px; }
            .contract-card { background: linear-gradient(135deg, #0ea271 0%, #0b7f5a 100%); color: white; padding: 24px; border-radius: 12px; text-align: center; margin: 30px 0; }
            .contract-number { font-size: 24px; font-weight: 700; letter-spacing: 1px; margin-top: 8px; }
            .cta { text-align: center; margin: 30px 0; }
            .cta-button { display: inline-block; background: #0ea271; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35); }
            .cta-button:hover { background: #0b7f5a; }
            .secondary-link { font-size: 13px; color: #6b7280; margin-top: 8px; }
            .secondary-link a { color: #0ea271; text-decoration: none; }
            .info { background: #f9fafb; border-radius: 12px; padding: 16px 20px; font-size: 14px; color: #4b5563; margin-top: 8px; }
            .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎊 عَقدي</div>
              <div class="subtitle">تم إتمام العقد الخاص بك بنجاح. يمكنك الآن حفظ نسخة من العقد ومتابعة المشروع من لوحة التحكم.</div>
            </div>
            <p style="font-size: 15px; color: #374151; line-height: 1.7;">مرحباً <strong>${data.clientName}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.7;">تم إتمام عقدك رقم <strong>${data.contractNumber}</strong>. يمكنك استعراض العقد وتحميل نسخة منه من خلال الرابط التالي:</p>
            <div class="contract-card">
              <div>رقم العقد</div>
              <div class="contract-number">${data.contractNumber}</div>
            </div>
            <div class="cta">
              <a href="${contractUrl}" class="cta-button">فتح العقد الآن</a>
              <div class="secondary-link">لوحة تحكم العملاء: <a href="${dashboardUrl}">${dashboardUrl}</a></div>
            </div>
            <div class="info">
              <strong>ملاحظة:</strong>
              <p style="margin-top: 4px;">يمكنك تحميل نسخة من العقد بصيغة HTML أو PDF (للطباعة) مباشرة من صفحة العقد.</p>
            </div>
            <div class="footer"><p>© 2025 عَقدي – منصة إدارة العقود والمشاريع.</p></div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Error sending finalized email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('sendContractFinalizedEmail error:', error)
    return { success: false, error: 'فشل في إرسال بريد إتمام العقد' }
  }
}
