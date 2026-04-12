import { NextResponse } from "next/server"
import { requireInviteAccess } from "../../route-helpers"

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
  const { error } = await admin
    .from("invite_codes")
    .update({ is_active: false })
    .eq("id", id)

  if (error) {
    console.error("[invite codes] deactivate failed", error)
    return NextResponse.json(
      { message: "Failed to deactivate invite code." },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
