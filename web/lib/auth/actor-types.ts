import type { User } from "@supabase/supabase-js"

export type GuestUserRecord = {
  id: string
  auth_user_id: string
  invite_code_id: string
  display_name: string
  status: "active" | "revoked"
  created_at: string
  updated_at: string
  last_seen_at: string | null
  invite_code?: {
    is_active: boolean
  } | null
}

export type FullUserActor = {
  kind: "user"
  authUser: User
}

export type GuestActor = {
  kind: "guest"
  authUser: User
  guest: GuestUserRecord
}

export type AppActor = FullUserActor | GuestActor

export class ActorAccessError extends Error {
  code: "FORBIDDEN" | "REVOKED_GUEST" | "UNAUTHENTICATED"

  constructor(code: "FORBIDDEN" | "REVOKED_GUEST" | "UNAUTHENTICATED") {
    super(code)
    this.code = code
  }
}
