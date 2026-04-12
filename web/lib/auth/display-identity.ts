import type { User } from "@supabase/supabase-js"
import type { AppActor } from "./actor-types"

export function getNormalizedDisplayName(displayName: unknown) {
  if (typeof displayName !== "string") {
    return null
  }

  const trimmedDisplayName = displayName.trim()

  return trimmedDisplayName || null
}

export function getUserAccountLabel(user: User | null | undefined) {
  const metadataDisplayName = getNormalizedDisplayName(
    user?.user_metadata?.display_name
  )

  return metadataDisplayName ?? user?.email ?? "Account"
}

export function getActorDisplayName(actor: AppActor) {
  if (actor.kind === "guest") {
    return getNormalizedDisplayName(actor.guest.display_name) ?? "Account"
  }

  return getUserAccountLabel(actor.authUser)
}
