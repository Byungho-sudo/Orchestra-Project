import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { hashInviteCode } from "@/lib/guest/invite-code-hash"

function mapRedeemInviteError(errorMessage: string | null) {
  switch (errorMessage) {
    case "guest_already_exists":
      return {
        message: "Guest access already exists for this session.",
        status: 200,
      }
    case "guest_revoked":
      return {
        message: "This guest access session has been revoked.",
        status: 403,
      }
    case "invalid_display_name":
      return {
        message: "Display name must be between 1 and 80 characters.",
        status: 400,
      }
    case "inactive_invite_code":
    case "expired_invite_code":
    case "invite_code_exhausted":
    case "invalid_invite_code":
      return {
        message: "This invite code is no longer available.",
        status: 400,
      }
    default:
      return {
        message: "Guest access could not be created. Please try again.",
        status: 500,
      }
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.info("[guest bootstrap] auth lookup", {
      authError: authError?.message ?? null,
      hasUser: Boolean(user),
      isAnonymous: user?.is_anonymous ?? null,
      userId: user?.id ?? null,
    })

    if (authError) {
      console.error("[guest bootstrap] auth lookup failed", authError)
      return NextResponse.json(
        {
          debugMessage: authError.message,
          message: "Authentication lookup failed.",
        },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { message: "Authentication is required." },
        { status: 401 }
      )
    }

    const body = (await request.json().catch(() => null)) as
      | { code?: string; displayName?: string }
      | null
    const rawCode = body?.code?.trim() ?? ""
    const displayName = body?.displayName?.trim() ?? ""

    if (!rawCode) {
      return NextResponse.json(
        { message: "Invite code is required." },
        { status: 400 }
      )
    }

    if (!displayName || displayName.length > 80) {
      return NextResponse.json(
        { message: "Display name must be between 1 and 80 characters." },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()
    const { data: existingGuestUser, error: existingGuestUserError } = await admin
      .from("guest_users")
      .select("id,invite_code:invite_codes(is_active)")
      .eq("auth_user_id", user.id)
      .maybeSingle<{ id: string; invite_code: { is_active: boolean } | null }>()

    if (existingGuestUserError) {
      console.error(
        "[guest bootstrap] guest lookup failed",
        existingGuestUserError
      )
      return NextResponse.json(
        {
          debugMessage: existingGuestUserError.message,
          message: "Guest bootstrap lookup failed.",
        },
        { status: 500 }
      )
    }

    if (existingGuestUser?.invite_code?.is_active) {
      console.info("[guest bootstrap] existing active guest", {
        guestUserId: existingGuestUser.id,
        userId: user.id,
      })
      return NextResponse.json({ redirectTo: "/projects" })
    }

    if (!user.is_anonymous) {
      return NextResponse.json(
        { message: "Sign out of your account before using guest access." },
        { status: 409 }
      )
    }

    const codeHash = hashInviteCode(rawCode)

    console.info("[guest bootstrap] redeeming invite", {
      codeHash,
      displayName,
      userId: user.id,
    })

    const { data: redeemedGuest, error: redeemError } = await admin.rpc(
      "redeem_guest_invite",
      {
        p_auth_user_id: user.id,
        p_code_hash: codeHash,
        p_display_name: displayName,
      }
    )

    if (redeemError) {
      console.error("[guest bootstrap] redeem rpc failed", {
        code: redeemError.code,
        details: redeemError.details,
        hint: redeemError.hint,
        message: redeemError.message,
      })

      if (redeemError.message === "guest_already_exists") {
        const { data: resolvedGuestUser, error: resolvedGuestUserError } =
          await admin
            .from("guest_users")
            .select("id,invite_code:invite_codes(is_active)")
            .eq("auth_user_id", user.id)
            .maybeSingle<{
              id: string
              invite_code: { is_active: boolean } | null
            }>()

        if (resolvedGuestUserError) {
          console.error(
            "[guest bootstrap] guest re-entry lookup failed",
            resolvedGuestUserError
          )
          return NextResponse.json(
            {
              debugMessage: resolvedGuestUserError.message,
              message: "Existing guest access could not be restored.",
            },
            { status: 500 }
          )
        }

        if (resolvedGuestUser?.invite_code?.is_active) {
          console.info("[guest bootstrap] restored existing guest session", {
            guestUserId: resolvedGuestUser.id,
            userId: user.id,
          })
          return NextResponse.json({ redirectTo: "/projects" })
        }

        return NextResponse.json(
          { message: "This invite code is no longer available." },
          { status: 400 }
        )
      }

      const mappedError = mapRedeemInviteError(redeemError.message)

      return NextResponse.json(
        {
          debugCode: redeemError.code,
          debugDetails: redeemError.details,
          debugHint: redeemError.hint,
          debugMessage: redeemError.message,
          message: mappedError.message,
        },
        { status: mappedError.status }
      )
    }

    console.info("[guest bootstrap] redeem rpc succeeded", {
      redeemedGuest,
      userId: user.id,
    })

    return NextResponse.json({ redirectTo: "/projects" })
  } catch (error) {
    console.error("[guest bootstrap] unexpected failure", error)

    return NextResponse.json(
      {
        debugMessage: error instanceof Error ? error.message : String(error),
        message: "Guest access could not be created. Please try again.",
      },
      { status: 500 }
    )
  }
}
