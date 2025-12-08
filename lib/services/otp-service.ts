/**
 * OTP Service for Contract Legal Verification
 * Handles OTP generation, sending, and verification
 */

import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

interface OTPGenerationResult {
  success: boolean;
  otp?: string;
  expiresIn?: number;
  error?: string;
}

interface OTPVerificationResult {
  success: boolean;
  verified?: boolean;
  attemptsLeft?: number;
  error?: string;
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via Email using Resend
 */
async function sendOTPEmail(
  email: string,
  otp: string,
  expiresIn: number
): Promise<boolean> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: 'عَقدي <onboarding@resend.dev>',
      to: email,
      subject: 'رمز التحقق - عَقدي',
      html: `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #0ea271; margin-bottom: 10px; }
            .title { font-size: 24px; color: #333; margin-bottom: 20px; }
            .otp-box { background: linear-gradient(135deg, #0ea271 0%, #0b7f5a 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 48px; font-weight: bold; letter-spacing: 10px; margin: 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
            .info { color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0; }
            .warning { background: #fef3c7; border-right: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔒 عَقدي</div>
              <div class="title">رمز التحقق من العقد</div>
            </div>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 16px; opacity: 0.9;">رمز التحقق الخاص بك</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">صالح لمدة ${expiresIn} دقائق</p>
            </div>
            
            <div class="info">
              <p>مرحباً،</p>
              <p>تم طلب رمز التحقق لتوثيق عقدك قانونياً. يرجى إدخال الرمز أعلاه في صفحة العقد لإتمام عملية التوثيق.</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ تنبيه أمني:</strong>
              <p style="margin: 5px 0 0 0;">إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة. لا تشارك هذا الرمز مع أي شخص.</p>
            </div>
            
            <div class="footer">
              <p>هذه رسالة تلقائية من نظام عَقدي</p>
              <p>© 2025 عَقدي. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ OTP email sent successfully!`);
    console.log(`   To: ${email}`);
    console.log(`   ID: ${result.data?.id}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return false;
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Try different headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

/**
 * Get verification metadata (user agent, device info, etc.)
 */
export function getVerificationMetadata(request: Request) {
  return {
    userAgent: request.headers.get('user-agent') || 'unknown',
    acceptLanguage: request.headers.get('accept-language') || 'unknown',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate and send OTP for contract verification
 */
export async function generateContractOTP(
  contractId: string,
  clientEmail: string,
  clientPhone: string,
  ipAddress: string
): Promise<OTPGenerationResult> {
  try {
    const supabase = await createClient();
    const otp = generateOTP();
    const expiresIn = 10; // 10 minutes

    // Update contract with OTP
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        otp_code: otp,
        otp_sent_at: new Date().toISOString(),
        otp_attempts: 0,
        client_ip_address: ipAddress,
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Error updating contract with OTP:', updateError);
      return { success: false, error: 'فشل في إنشاء رمز التحقق' };
    }

    // Send OTP via Email
    if (clientEmail) {
      const emailSent = await sendOTPEmail(clientEmail, otp, expiresIn);
      if (!emailSent) {
        console.warn('Failed to send OTP email, but continuing...');
      }
    }

    // Log OTP in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 OTP for contract ${contractId}: ${otp}`);
      console.log(`📧 Sent to: ${clientEmail}`);
    }

    return {
      success: true,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined, // Only in development
      expiresIn,
    };
  } catch (error) {
    console.error('Error generating OTP:', error);
    return { success: false, error: 'حدث خطأ في إنشاء رمز التحقق' };
  }
}

/**
 * Verify OTP code for contract
 */
export async function verifyContractOTP(
  contractId: string,
  otpCode: string,
  ipAddress: string,
  metadata: any
): Promise<OTPVerificationResult> {
  try {
    const supabase = await createClient();

    // Get contract with OTP
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('otp_code, otp_sent_at, otp_attempts, otp_verified_at, account_id')
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      return { success: false, error: 'العقد غير موجود' };
    }

    // Check if already verified
    if (contract.otp_verified_at) {
      return { success: false, error: 'تم التحقق من العقد مسبقاً' };
    }

    // Check if OTP expired (10 minutes)
    const sentAt = new Date(contract.otp_sent_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - sentAt.getTime()) / (1000 * 60);

    if (diffMinutes > 10) {
      return { success: false, error: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد' };
    }

    // Check attempts (max 5)
    if (contract.otp_attempts >= 5) {
      return { success: false, error: 'تم تجاوز الحد الأقصى للمحاولات' };
    }

    // Verify OTP
    if (contract.otp_code !== otpCode) {
      // Increment attempts
      await supabase
        .from('contracts')
        .update({ otp_attempts: contract.otp_attempts + 1 })
        .eq('id', contractId);

      return {
        success: false,
        verified: false,
        attemptsLeft: 5 - (contract.otp_attempts + 1),
        error: 'رمز التحقق غير صحيح',
      };
    }

    // OTP is correct - mark as verified
    const { error: verifyError } = await supabase
      .from('contracts')
      .update({
        otp_verified_at: new Date().toISOString(),
        client_ip_address: ipAddress, // Save client IP
        legal_timestamp: new Date().toISOString(),
        verification_metadata: metadata,
        status: 'active', // Activate contract after verification
      })
      .eq('id', contractId);

    if (verifyError) {
      console.error('Error verifying OTP:', verifyError);
      return { success: false, error: 'فشل في التحقق من الرمز' };
    }

    // Create activity log
    await supabase.from('contract_activities').insert({
      account_id: contract.account_id,
      contract_id: contractId,
      activity_type: 'otp_verified',
      description: `تم التحقق من العقد بنجاح عبر OTP من IP: ${ipAddress}`,
      metadata: {
        ip_address: ipAddress,
        verified_at: new Date().toISOString(),
        ...metadata,
      },
    });

    return {
      success: true,
      verified: true,
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: 'حدث خطأ في التحقق من الرمز' };
  }
}

/**
 * Resend OTP for contract
 */
export async function resendContractOTP(
  contractId: string,
  clientEmail: string,
  clientPhone: string,
  ipAddress: string
): Promise<OTPGenerationResult> {
  try {
    const supabase = await createClient();

    // Check if contract exists and not verified
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('otp_verified_at, otp_sent_at')
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      return { success: false, error: 'العقد غير موجود' };
    }

    if (contract.otp_verified_at) {
      return { success: false, error: 'تم التحقق من العقد مسبقاً' };
    }

    // Check if last OTP was sent less than 1 minute ago
    if (contract.otp_sent_at) {
      const sentAt = new Date(contract.otp_sent_at);
      const now = new Date();
      const diffSeconds = (now.getTime() - sentAt.getTime()) / 1000;

      if (diffSeconds < 60) {
        return {
          success: false,
          error: `يرجى الانتظار ${Math.ceil(60 - diffSeconds)} ثانية قبل إعادة الإرسال`,
        };
      }
    }

    // Generate new OTP
    return await generateContractOTP(contractId, clientEmail, clientPhone, ipAddress);
  } catch (error) {
    console.error('Error resending OTP:', error);
    return { success: false, error: 'حدث خطأ في إعادة إرسال الرمز' };
  }
}
