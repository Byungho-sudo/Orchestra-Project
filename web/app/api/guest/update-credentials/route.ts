import { NextResponse } from "next/server"
import { requireAuthenticatedActor } from "@/lib/auth/require-authenticated-actor"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { hashInviteCode } from "@/lib/guest/invite-code-hash"

type UpdateGuestCredentialsBody = {
  accessCode?: string
  displayName?: string
}

export async function PATCH(request: Request) {
  let actor
  try {
    actor = await requireAuthenticatedActor()
  } catch {
    return NextResponse.json(
      { message: "Authentication is required." },
      { status: 401 }
    )
  }

  if (actor.kind !== "guest") {
    return NextResponse.json(
      { message: "Only guest users can update guest settings." },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => null)) as
    | UpdateGuestCredentialsBody
    | null
  const trimmedDisplayName = body?.displayName?.trim() ?? ""
  const trimmedAccessCode = body?.accessCode?.trim() ?? ""

  if (!trimmedDisplayName || trimmedDisplayName.length > 80) {
    return NextResponse.json(
      { message: "Display name must be between 1 and 80 characters." },
      { status: 400 }
    )
  }

  const admin = createSupabaseAdminClient()
  const updatedAt = new Date().toISOString()

  if (trimmedAccessCode) {
    const { error: inviteCodeError } = await admin
      .from("invite_codes")
      .update({
        code_hash: hashInviteCode(trimmedAccessCode),
        updated_at: updatedAt,
      })
      .eq("id", actor.guest.invite_code_id)

    if (inviteCodeError) {
      const isInviteHashConflict = inviteCodeError.code === "23505"

      return NextResponse.json(
        {
          message: isInviteHashConflict
            ? "That access code is already in use. Choose a different one."
            : "Guest settings could not be updated. Please try again.",
        },
        { status: isInviteHashConflict ? 409 : 500 }
      )
    }
  }

  const { error: guestUserError } = await admin
    .from("guest_users")
    .update({
      display_name: trimmedDisplayName,
      updated_at: updatedAt,
    })
    .eq("id", actor.guest.id)

  if (guestUserError) {
    return NextResponse.json(
      {
        message: "Guest settings could not be updated. Please try again.",
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    displayName: trimmedDisplayName,
    success: true,
  })
}
