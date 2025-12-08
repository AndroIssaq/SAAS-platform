import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Supabase Keep-Alive Endpoint
 * يتم استدعاء هذا الـ endpoint يومياً لمنع إيقاف Supabase بعد 14 يوم من عدم النشاط
 * 
 * استخدام:
 * - Vercel Cron Jobs (موصى به)
 * - GitHub Actions
 * - cron-job.org
 * - أي خدمة cron خارجية
 */

export async function GET(request: Request) {
  try {
    // التحقق من Authorization header (اختياري لكن موصى به للأمان)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    // إذا كان هناك CRON_SECRET في الـ env، نتحقق منه
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // إجراء استعلامات على جداول مختلفة للحفاظ على النشاط
    const queries = await Promise.allSettled([
      supabase.from("users").select("id").limit(1),
      supabase.from("contracts").select("id").limit(1),
      supabase.from("contract_activities").select("id").limit(1),
      supabase.from("notifications").select("id").limit(1),
    ])

    // عد الاستعلامات الناجحة
    const successfulQueries = queries.filter(
      (result) => result.status === "fulfilled"
    ).length

    if (successfulQueries === 0) {
      console.error("❌ All Supabase queries failed")
      return NextResponse.json(
        {
          success: false,
          error: "All database queries failed",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    console.log(
      `✅ Supabase keep-alive successful: ${successfulQueries}/4 queries succeeded`,
      new Date().toISOString()
    )

    return NextResponse.json({
      success: true,
      message: "Supabase keep-alive ping successful",
      queries_succeeded: successfulQueries,
      total_queries: 4,
      timestamp: new Date().toISOString(),
      next_run: "في خلال 24 ساعة",
    })
  } catch (error: any) {
    console.error("❌ Supabase keep-alive failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// يمكن استخدام POST أيضاً
export async function POST(request: Request) {
  return GET(request)
}
