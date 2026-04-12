import { NextResponse } from "next/server"
import { generateRawInviteCode } from "@/lib/guest/generate-raw-invite-code"
import { hashInviteCode } from "@/lib/guest/invite-code-hash"
import { requireInviteAccess, type InviteCodeRecord } from "../../route-helpers"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireInviteAccess()

  if ("errorResponse" in access) {
    return access.errorResponse
  }

  const { id } = await context.params

  if (!id) {
    return NextResponse.json(
      { message: "Invite code id is required." },
      { status: 400 }
    )
  }

  const { admin } = access
  const { data: guestUser, error: guestUserError } = await admin
    .from("guest_users")
    .select("id,display_name")
    .eq("invite_code_id", id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; display_name: string }>()

  if (guestUserError) {
    console.error("[invite codes] guest recovery lookup failed", guestUserError)
    return NextResponse.json(
      { message: "Failed to prepare guest recovery." },
      { status: 500 }
    )
  }

  if (!guestUser) {
    return NextResponse.json(
      { message: "A recovery code can only be generated after a guest has used this invite." },
      { status: 409 }
    )
  }

  const rawCode = generateRawInviteCode()
  const codeHash = hashInviteCode(rawCode)

  const { data: inviteCode, error: updateError } = await admin
    .from("invite_codes")
    .update({
      code_hash: codeHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,label,is_active,use_count,max_uses,created_at,expires_at")
    .single()

  if (updateError || !inviteCode) {
    console.error("[invite codes] regenerate access code failed", updateError)
    return NextResponse.json(
      { message: "Failed to generate a new guest access code." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    inviteCode: {
      ...(inviteCode as Omit<InviteCodeRecord, "guest_display_name">),
      guest_display_name: guestUser.display_name,
    },
    rawCode,
  })
}
