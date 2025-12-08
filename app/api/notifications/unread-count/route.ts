import { NextRequest, NextResponse } from 'next/server'
import { getUnreadNotificationsCount } from '@/app/actions/notifications'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })
  }

  const result = await getUnreadNotificationsCount(userId)

  if (!result.success) {
    console.error('Unread notifications API error:', result.error)
    // تعامل مع الخطأ كحالة بدون بيانات بدلاً من إرجاع 500 حتى لا يتعطل الـ UI
    return NextResponse.json({ success: true, count: 0 }, { status: 200 })
  }

  return NextResponse.json(result)
}
