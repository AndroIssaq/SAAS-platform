import { NextRequest, NextResponse } from "next/server"
import { getMemberKeyEnvelope, upsertMemberKeyEnvelope } from "@/lib/actions/workspace-keys"

export async function GET() {
  const result = await getMemberKeyEnvelope()

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: result.data })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const encryptedWorkspaceKey = body?.encryptedWorkspaceKey

    if (typeof encryptedWorkspaceKey !== "string" || encryptedWorkspaceKey.length < 16) {
      return NextResponse.json({ success: false, error: "قيمة الظرف غير صالحة" }, { status: 400 })
    }

    const result = await upsertMemberKeyEnvelope({
      encryptedWorkspaceKey,
      keyVersion: body?.keyVersion,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("workspace/member-key POST error", error)
    return NextResponse.json({ success: false, error: "تعذّر حفظ الظرف" }, { status: 500 })
  }
}
