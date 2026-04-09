import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  ActorAccessError,
  type AppActor,
  type GuestUserRecord,
} from "./actor-types"

export async function getAppActor(): Promise<AppActor | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: guestUser } = await supabase
    .from("guest_users")
    .select(
      "id,auth_user_id,invite_code_id,display_name,status,created_at,updated_at,last_seen_at,invite_code:invite_codes!inner(is_active)"
    )
    .eq("auth_user_id", user.id)
    .maybeSingle<GuestUserRecord>()

  if (guestUser) {
    if (!guestUser.invite_code?.is_active) {
      throw new ActorAccessError("REVOKED_GUEST")
    }

    return {
      kind: "guest",
      authUser: user,
      guest: guestUser,
    }
  }

  if (user.is_anonymous) {
    return null
  }

  return {
    kind: "user",
    authUser: user,
  }
}
