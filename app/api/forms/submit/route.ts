import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  console.log("=== FORM SUBMISSION RECEIVED ===")

  try {
    let formData: FormData
    const contentType = req.headers.get("content-type") || ""
    console.log("Content-Type:", contentType)

    if (contentType.includes("application/json")) {
      const json = await req.json()
      formData = new FormData()
      for (const [key, value] of Object.entries(json)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      }
    } else {
      formData = await req.formData()
    }

    const formKey = formData.get("form_key")
    console.log("Form Key received:", formKey)

    if (!formKey || typeof formKey !== "string") {
      console.error("Missing form_key")
      return NextResponse.json({ success: false, error: "form_key مطلوب" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Try to find form by ID first (if formKey is a UUID), then by form_key
    let form: any = null
    let formError: any = null

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formKey)
    console.log("Is UUID:", isUUID)

    if (isUUID) {
      console.log("Searching by ID...")
      const result = await supabase
        .from("forms")
        .select("id, config")
        .eq("id", formKey)
        .single()
      form = result.data
      formError = result.error
      console.log("Search by ID result:", { found: !!form, error: formError?.message })
    }

    // If not found by ID, try by form_key
    if (!form) {
      console.log("Searching by form_key...")
      const result = await supabase
        .from("forms")
        .select("id, config")
        .eq("form_key", formKey)
        .single()
      form = result.data
      formError = result.error
      console.log("Search by form_key result:", { found: !!form, error: formError?.message })
    }

    if (formError || !form) {
      console.error("Form not found:", { formKey, formError })
      return NextResponse.json({ success: false, error: "الفورم غير موجودة" }, { status: 404 })
    }

    console.log("Form found! ID:", form.id)

    const config: any = form.config || {}
    const fields: any[] = Array.isArray(config.fields) ? config.fields : []
    const primaryEmailField = fields.find((f) => f.isPrimaryEmail) || fields.find((f) => f.type === "email")

    let email: string | null = null
    if (primaryEmailField && typeof primaryEmailField.name === "string") {
      const emailValue = formData.get(primaryEmailField.name)
      if (typeof emailValue === "string" && emailValue.trim()) {
        email = emailValue.trim()
      }
    }

    const data: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (key === "form_key") continue
      if (typeof value === "string") {
        data[key] = value
      }
    }

    const sourceUrl = req.headers.get("referer") || req.headers.get("origin") || null

    // Build insert payload with only required fields
    // Add email and source_url to the data object if the columns don't exist
    const insertPayload: Record<string, any> = {
      form_id: form.id,
      data: {
        ...data,
        _email: email, // Store email in data just in case column doesn't exist
        _source_url: sourceUrl
      }
    }

    // Try to insert with all columns first
    let insertError: any = null

    // First try with all columns
    const { error: err1 } = await supabase.from("form_submissions").insert({
      form_id: form.id,
      email,
      data,
      source_url: sourceUrl,
    })

    if (err1) {
      // If failed (maybe columns don't exist), try minimal insert
      console.warn("Full insert failed, trying minimal:", err1.message)
      const { error: err2 } = await supabase.from("form_submissions").insert({
        form_id: form.id,
        data: {
          ...data,
          email: email,
          source_url: sourceUrl
        }
      })
      insertError = err2
    }

    if (insertError) {
      console.error("Error inserting form submission:", insertError)
      return NextResponse.json({ success: false, error: "فشل في حفظ البيانات" }, { status: 500 })
    }

    console.log("✅ Form submission saved successfully!", { formId: form.id, email, dataKeys: Object.keys(data) })

    const accept = req.headers.get("accept") || ""
    if (accept.includes("text/html")) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      const redirectTarget = sourceUrl && sourceUrl.startsWith("http") ? sourceUrl : `${baseUrl}/forms/${formKey}`
      const url = new URL(redirectTarget)
      url.searchParams.set("form_submitted", "1")
      return NextResponse.redirect(url.toString(), 303)
    }

    return NextResponse.json({ success: true, message: "تم حفظ البيانات بنجاح" })
  } catch (error) {
    console.error("Unexpected error in form submission:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ غير متوقع" }, { status: 500 })
  }
}
