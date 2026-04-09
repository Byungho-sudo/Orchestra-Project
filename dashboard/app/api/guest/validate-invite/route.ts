import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { hashInviteCode } from "@/lib/guest/invite-code-hash"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { code?: string }
    | null
  const rawCode = body?.code?.trim() ?? ""

  if (!rawCode) {
    return NextResponse.json(
      { message: "Enter an invite code.", valid: false },
      { status: 400 }
    )
  }

  const admin = createSupabaseAdminClient()
  const codeHash = hashInviteCode(rawCode)
  const { data: inviteCode } = await admin
    .from("invite_codes")
    .select("id,is_active,max_uses,use_count,expires_at")
    .eq("code_hash", codeHash)
    .maybeSingle<{
      id: string
      is_active: boolean
      max_uses: number | null
      use_count: number
      expires_at: string | null
    }>()

  if (!inviteCode) {
    return NextResponse.json({ valid: false }, { status: 200 })
  }

  const isExpired =
    inviteCode.expires_at !== null &&
    new Date(inviteCode.expires_at).getTime() <= Date.now()
  const isExhausted =
    inviteCode.max_uses !== null && inviteCode.use_count >= inviteCode.max_uses

  return NextResponse.json({
    valid: inviteCode.is_active && !isExpired && !isExhausted,
  })
}
