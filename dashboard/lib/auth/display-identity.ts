import type { AppActor } from "./actor-types"

export function getActorDisplayName(actor: AppActor) {
  if (actor.kind === "guest") {
    return actor.guest.display_name
  }

  const metadataDisplayName = actor.authUser.user_metadata?.display_name

  if (typeof metadataDisplayName === "string" && metadataDisplayName.trim()) {
    return metadataDisplayName.trim()
  }

  return actor.authUser.email ?? "Unknown"
}
