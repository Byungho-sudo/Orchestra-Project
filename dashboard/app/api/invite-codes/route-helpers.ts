import { NextResponse } from "next/server"
import { ActorAccessError } from "@/lib/auth/actor-types"
import { requireFullUser } from "@/lib/auth/require-full-user"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

export type InviteCodeRecord = {
  id: string
  label: string | null
  is_active: boolean
  use_count: number
  max_uses: number | null
  created_at: string
  expires_at: string | null
}

export async function requireInviteAccess() {
  try {
    await requireFullUser()
  } catch (error) {
    if (error instanceof ActorAccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : 403

      return {
        errorResponse: NextResponse.json(
          { message: "Invite access is only available to full users." },
          { status }
        ),
      }
    }

    throw error
  }

  return {
    admin: createSupabaseAdminClient(),
  }
}
