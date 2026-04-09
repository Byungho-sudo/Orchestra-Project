import { ActorAccessError, type AppActor } from "./actor-types"
import { getAppActor } from "./get-app-actor"

export async function requireAuthenticatedActor(): Promise<AppActor> {
  const actor = await getAppActor()

  if (!actor) {
    throw new ActorAccessError("UNAUTHENTICATED")
  }

  return actor
}
