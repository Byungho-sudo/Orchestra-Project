import { NextResponse } from "next/server"
import { requireInviteAccess, type InviteCodeRecord } from "./route-helpers"

export async function GET() {
  const access = await requireInviteAccess()

  if ("errorResponse" in access) {
    return access.errorResponse
  }

  const { admin } = access
  const { data, error } = await admin
    .from("invite_codes")
    .select("id,label,is_active,use_count,max_uses,created_at,expires_at")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[invite codes] fetch failed", error)
    return NextResponse.json(
      { message: "Failed to load invite codes." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    inviteCodes: ((data as InviteCodeRecord[] | null) ?? []).map((inviteCode) => ({
      ...inviteCode,
    })),
  })
}
