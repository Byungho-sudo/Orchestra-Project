import { NextResponse } from "next/server"
import { generateRawInviteCode } from "@/lib/guest/generate-raw-invite-code"
import { hashInviteCode } from "@/lib/guest/invite-code-hash"
import { requireInviteAccess, type InviteCodeRecord } from "../route-helpers"

type CreateInviteCodeBody = {
  expiresAt?: string | null
  label?: string
  maxUses?: number | null
}

export async function POST(request: Request) {
  const access = await requireInviteAccess()

  if ("errorResponse" in access) {
    return access.errorResponse
  }

  const body = (await request.json().catch(() => null)) as CreateInviteCodeBody | null
  const trimmedLabel = body?.label?.trim() || null

  if (!trimmedLabel) {
    return NextResponse.json(
      { message: "Display name is required." },
      { status: 400 }
    )
  }
  const rawMaxUses = body?.maxUses
  const normalizedMaxUses =
    typeof rawMaxUses === "number" && Number.isFinite(rawMaxUses)
      ? Math.max(1, Math.floor(rawMaxUses))
      : null
  const rawExpiresAt = body?.expiresAt?.trim() || null
  const normalizedExpiresAt = rawExpiresAt ? new Date(rawExpiresAt) : null

  if (
    normalizedExpiresAt &&
    Number.isNaN(normalizedExpiresAt.getTime())
  ) {
    return NextResponse.json(
      { message: "Expiration date is invalid." },
      { status: 400 }
    )
  }

  const rawCode = generateRawInviteCode()
  const codeHash = hashInviteCode(rawCode)
  const { admin } = access

  const { data, error } = await admin
    .from("invite_codes")
    .insert({
      code_hash: codeHash,
      code_prefix: "ORCH",
      created_at: new Date().toISOString(),
      expires_at: normalizedExpiresAt?.toISOString() ?? null,
      is_active: true,
      label: trimmedLabel,
      max_uses: normalizedMaxUses,
      use_count: 0,
    })
    .select("id,label,is_active,use_count,max_uses,created_at,expires_at")
    .single()

  if (error || !data) {
    console.error("[invite codes] create failed", error)
    return NextResponse.json(
      { message: "Failed to create invite code." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    inviteCode: {
      ...(data as Omit<InviteCodeRecord, "guest_display_name">),
      guest_display_name: null,
    },
    rawCode,
  })
}
