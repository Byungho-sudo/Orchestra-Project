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

  const inviteCodes = ((data as Omit<InviteCodeRecord, "guest_display_name">[] | null) ?? [])

  const inviteIds = inviteCodes.map((inviteCode) => inviteCode.id)
  let latestGuestDisplayNameByInviteId = new Map<string, string>()

  if (inviteIds.length > 0) {
    const { data: guestUsers, error: guestUsersError } = await admin
      .from("guest_users")
      .select("invite_code_id,display_name,updated_at")
      .in("invite_code_id", inviteIds)
      .order("updated_at", { ascending: false })

    if (guestUsersError) {
      console.error("[invite codes] guest lookup failed", guestUsersError)
      return NextResponse.json(
        { message: "Failed to load invite codes." },
        { status: 500 }
      )
    }

    latestGuestDisplayNameByInviteId = new Map(
      ((guestUsers as {
        invite_code_id: string
        display_name: string
        updated_at: string
      }[] | null) ?? [])
        .filter(
          (guestUser, index, collection) =>
            collection.findIndex(
              (candidate) => candidate.invite_code_id === guestUser.invite_code_id
            ) === index
        )
        .map((guestUser) => [guestUser.invite_code_id, guestUser.display_name])
    )
  }

  return NextResponse.json({
    inviteCodes: inviteCodes.map((inviteCode) => ({
      ...inviteCode,
      guest_display_name:
        latestGuestDisplayNameByInviteId.get(inviteCode.id) ?? null,
    })),
  })
}
