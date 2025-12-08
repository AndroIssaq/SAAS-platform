import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Diagnostic endpoint to check forms and submissions
export async function GET() {
    try {
        const supabase = createAdminClient()

        // 1. Get all forms
        const { data: forms, error: formsError } = await supabase
            .from("forms")
            .select("id, form_key, title, created_at")
            .limit(10)

        // 2. Get all submissions
        const { data: submissions, error: submissionsError } = await supabase
            .from("form_submissions")
            .select("id, form_id, created_at")
            .limit(10)

        // 3. Check table columns
        const { data: formColumns } = await supabase
            .rpc('get_table_columns', { table_name: 'forms' })
            .single()

        const result = {
            timestamp: new Date().toISOString(),
            forms: {
                count: forms?.length || 0,
                data: forms || [],
                error: formsError?.message || null
            },
            submissions: {
                count: submissions?.length || 0,
                data: submissions || [],
                error: submissionsError?.message || null
            },
            debug: {
                serviceRoleConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing"
            }
        }

        console.log("=== FORMS DIAGNOSTIC ===")
        console.log(JSON.stringify(result, null, 2))

        return NextResponse.json(result)
    } catch (error: any) {
        console.error("Diagnostic error:", error)
        return NextResponse.json({
            error: error?.message || "Unknown error",
            stack: error?.stack
        }, { status: 500 })
    }
}
