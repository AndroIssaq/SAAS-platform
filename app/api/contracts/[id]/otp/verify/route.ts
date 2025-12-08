import { NextRequest, NextResponse } from 'next/server'
import { verifyContractOTP } from '@/lib/services/otp-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const body = await request.json()
    const { otpCode, metadata } = body

    if (!otpCode) {
      return NextResponse.json(
        { error: 'رمز التحقق مطلوب' },
        { status: 400 }
      )
    }

    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'

    // Verify OTP
    const result = await verifyContractOTP(
      contractId,
      otpCode,
      ipAddress,
      metadata || {}
    )

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          attemptsLeft: result.attemptsLeft 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'تم التحقق بنجاح'
    })
  } catch (error) {
    console.error('Error in OTP verify API:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في التحقق من الرمز' },
      { status: 500 }
    )
  }
}
