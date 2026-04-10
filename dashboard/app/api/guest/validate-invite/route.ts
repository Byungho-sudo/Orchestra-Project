import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { hashInviteCode } from "@/lib/guest/invite-code-hash"
import { supabaseUrl } from "@/lib/supabase-config"

export async function POST(request: Request) {
  try {
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
    const normalizedCode = rawCode.trim().toLowerCase()

    console.info("[guest validate-invite] received code", {
      codeHashPrefix: codeHash.slice(0, 12),
      environment: process.env.NODE_ENV,
      invite_code_hash: codeHash,
      normalizedCode,
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      rawCode,
      rawCodeLength: rawCode.length,
      supabaseHost: new URL(supabaseUrl).host,
    })

    const { data: inviteCode, error } = await admin
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

    if (error) {
      console.error("[guest validate-invite] query failed", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
        supabaseHost: new URL(supabaseUrl).host,
      })

      return NextResponse.json(
        {
          message: "Invite validation failed.",
          valid: false,
        },
        { status: 500 }
      )
    }

    if (!inviteCode) {
      console.info("[guest validate-invite] invite not found", {
        codeHashPrefix: codeHash.slice(0, 12),
        environment: process.env.NODE_ENV,
        invite_code_hash: codeHash,
        inviteRecordFound: false,
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        normalizedCode,
        rawCode,
        supabaseHost: new URL(supabaseUrl).host,
      })

      return NextResponse.json({ valid: false }, { status: 200 })
    }

    const isExpired =
      inviteCode.expires_at !== null &&
      new Date(inviteCode.expires_at).getTime() <= Date.now()
    const isExhausted =
      inviteCode.max_uses !== null && inviteCode.use_count >= inviteCode.max_uses
    const isValid = inviteCode.is_active && !isExpired && !isExhausted

    console.info("[guest validate-invite] invite resolved", {
      codeHashPrefix: codeHash.slice(0, 12),
      environment: process.env.NODE_ENV,
      expiresAt: inviteCode.expires_at,
      invite_code_hash: codeHash,
      inviteCodeId: inviteCode.id,
      inviteRecordFound: true,
      isActive: inviteCode.is_active,
      isExhausted,
      isExpired,
      isValid,
      maxUses: inviteCode.max_uses,
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      normalizedCode,
      rawCode,
      supabaseHost: new URL(supabaseUrl).host,
      useCount: inviteCode.use_count,
    })

    return NextResponse.json({
      valid: isValid,
    })
  } catch (error) {
    console.error("[guest validate-invite] unexpected failure", {
      error: error instanceof Error ? error.message : String(error),
      supabaseHost: (() => {
        try {
          return new URL(supabaseUrl).host
        } catch {
          return null
        }
      })(),
    })

    return NextResponse.json(
      {
        message: "Invite validation failed.",
        valid: false,
      },
      { status: 500 }
    )
  }
}
