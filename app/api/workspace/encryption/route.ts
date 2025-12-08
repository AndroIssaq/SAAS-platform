import { NextRequest, NextResponse } from "next/server"
import { getWorkspacePublicKey, upsertWorkspacePublicKey } from "@/lib/actions/workspace-keys"

export async function GET() {
  const result = await getWorkspacePublicKey()

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: result.data })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await upsertWorkspacePublicKey({
      publicKey: body?.publicKey,
      keyType: body?.keyType,
      encryptionVersion: body?.encryptionVersion,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("workspace/encryption POST error", error)
    return NextResponse.json({ success: false, error: "تعذّر حفظ المفتاح" }, { status: 500 })
  }
}
