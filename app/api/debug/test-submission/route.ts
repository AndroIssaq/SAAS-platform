import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Test endpoint to create a sample submission
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient()

        // Get a form to test with
        const { data: forms, error: formsError } = await supabase
            .from("forms")
            .select("id, title")
            .limit(1)

        if (formsError || !forms || forms.length === 0) {
            return NextResponse.json({
                success: false,
                error: "No forms found",
                formsError: formsError?.message
            }, { status: 404 })
        }

        const testForm = forms[0]

        // Try to insert a test submission
        const { data: submission, error: insertError } = await supabase
            .from("form_submissions")
            .insert({
                form_id: testForm.id,
                data: {
                    name: "Test User",
                    email: "test@example.com",
                    message: "This is a test submission",
                    _test: true
                }
            })
            .select()
            .single()

        if (insertError) {
            console.error("Insert error:", insertError)
            return NextResponse.json({
                success: false,
                error: insertError.message,
                code: insertError.code,
                details: insertError.details,
                hint: insertError.hint,
                formId: testForm.id
            }, { status: 500 })
        }

        // Verify it was saved
        const { data: verifyData, error: verifyError } = await supabase
            .from("form_submissions")
            .select("*")
            .eq("id", submission.id)
            .single()

        return NextResponse.json({
            success: true,
            message: "Test submission created successfully!",
            form: testForm,
            submission: verifyData || submission,
            verifyError: verifyError?.message
        })

    } catch (error: any) {
        console.error("Test submission error:", error)
        return NextResponse.json({
            error: error?.message || "Unknown error"
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        message: "Send a POST request to this endpoint to create a test submission",
        example: "curl -X POST http://localhost:3000/api/debug/test-submission"
    })
}
