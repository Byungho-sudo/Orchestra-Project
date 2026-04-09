import { ActorAccessError, type FullUserActor } from "./actor-types"
import { requireAuthenticatedActor } from "./require-authenticated-actor"

export async function requireFullUser(): Promise<FullUserActor> {
  const actor = await requireAuthenticatedActor()

  if (actor.kind !== "user") {
    throw new ActorAccessError("FORBIDDEN")
  }

  return actor
}
