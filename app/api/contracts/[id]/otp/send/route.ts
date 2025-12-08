import { NextRequest, NextResponse } from 'next/server'
import { generateContractOTP } from '@/lib/services/otp-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const supabase = await createClient()

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('client_email, client_phone, client_name')
      .eq('id', contractId)
      .single()

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'العقد غير موجود' },
        { status: 404 }
      )
    }

    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'

    // Generate and send OTP
    const result = await generateContractOTP(
      contractId,
      contract.client_email,
      contract.client_phone,
      ipAddress
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق بنجاح',
      expiresIn: result.expiresIn,
      // Only return OTP in development
      otp: process.env.NODE_ENV === 'development' ? result.otp : undefined
    })
  } catch (error) {
    console.error('Error in OTP send API:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إرسال رمز التحقق' },
      { status: 500 }
    )
  }
}
