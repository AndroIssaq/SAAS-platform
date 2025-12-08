import { NextResponse } from 'next/server'
import { completeUserActivation } from '@/app/actions/auth-activation'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = body?.token as string | undefined
    const password = body?.password as string | undefined

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'بيانات مفقودة: رمز التفعيل أو كلمة المرور' },
        { status: 400 }
      )
    }

    const result = await completeUserActivation(token, password)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'فشل في تفعيل الحساب' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Activation API error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع أثناء تفعيل الحساب' },
      { status: 500 }
    )
  }
}
