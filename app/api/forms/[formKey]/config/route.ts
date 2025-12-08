import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ formKey: string }> },
) {
  try {
    const { formKey } = await params
    const supabase = createAdminClient()

    let decodedKey = formKey
    try {
      decodedKey = decodeURIComponent(formKey)
    } catch {
      // ignore decode errors
    }

    console.log("[Forms Config API] Incoming formKey:", formKey, "decoded:", decodedKey)

    const { data: rawData, error: rawError } = await supabase
      .from("forms")
      .select("*")
      .eq("form_key", decodedKey)
      .single()

    let data = rawData
    let error = rawError

    // Fallback: Try to find by ID if not found and looks like UUID
    if ((error || !data) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedKey)) {
      const { data: byId, error: byIdError } = await supabase
        .from("forms")
        .select("*")
        .eq("id", decodedKey)
        .single()

      if (byId && !byIdError) {
        data = byId
        error = null
      }
    }

    if (error || !data) {
      console.error("[Forms Config API] Form not found or error", { decodedKey, error })
      return new NextResponse(JSON.stringify({ success: false, error: "الفورم غير موجودة" }), {
        status: 404,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json; charset=utf-8",
        },
      })
    }

    // Map new schema (config/title) to old schema expected by embed script (settings/name)
    const settings: any = data.config || data.settings || {}
    const title = data.title || data.name || "Untitled Form"

    // Determine embed settings from config if available
    const embedConfig = settings.embed || {}
    const embed = {
      mode: embedConfig.mode || (data.type === 'popup' ? 'popup' : 'inline'),
      maxWidth: embedConfig.maxWidth || settings.width || 480,
      popupDelayMs: embedConfig.popupDelayMs || 2000,
      popupOncePerSession: embedConfig.popupOncePerSession ?? true,
      popupHeightVh: embedConfig.popupHeightVh || 80,
    }

    return NextResponse.json(
      {
        success: true,
        formKey: data.form_key || data.id, // Prefer the actual public key
        title: title,
        embed,
      },
      {
        headers: CORS_HEADERS,
      },
    )
  } catch (err) {
    console.error("Error in /api/forms/[formKey]/config:", err)
    return new NextResponse(JSON.stringify({ success: false, error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json; charset=utf-8",
      },
    })
  }
}

