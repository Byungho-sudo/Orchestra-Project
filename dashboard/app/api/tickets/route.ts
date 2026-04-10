import { NextResponse } from "next/server"
import { getActorDisplayName } from "@/lib/auth/display-identity"
import { ActorAccessError } from "@/lib/auth/actor-types"
import { requireAuthenticatedActor } from "@/lib/auth/require-authenticated-actor"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

type CreateTicketBody = {
  description?: string | null
  priority?: string
  title?: string
  type?: string
}

const allowedTypes = new Set(["bug", "feature", "improvement", "refactor"])
const allowedPriorities = new Set(["low", "medium", "high"])

export async function POST(request: Request) {
  let actor

  try {
    actor = await requireAuthenticatedActor()
  } catch (error) {
    if (error instanceof ActorAccessError) {
      return NextResponse.json(
        { message: "Authentication is required." },
        { status: error.code === "UNAUTHENTICATED" ? 401 : 403 }
      )
    }

    throw error
  }

  const body = (await request.json().catch(() => null)) as CreateTicketBody | null
  const title = body?.title?.trim() ?? ""
  const description = body?.description?.trim() || null
  const type = body?.type ?? "improvement"
  const priority = body?.priority ?? "medium"

  if (!title) {
    return NextResponse.json(
      { message: "Title is required." },
      { status: 400 }
    )
  }

  if (!allowedTypes.has(type)) {
    return NextResponse.json(
      { message: "Ticket type is invalid." },
      { status: 400 }
    )
  }

  if (!allowedPriorities.has(priority)) {
    return NextResponse.json(
      { message: "Ticket priority is invalid." },
      { status: 400 }
    )
  }

  const admin = createSupabaseAdminClient()
  const creatorDisplayName = getActorDisplayName(actor)
  const { data, error } = await admin
    .from("tickets")
    .insert({
      creator_display_name: creatorDisplayName,
      creator_kind: actor.kind,
      description,
      priority,
      status: "inbox",
      title,
      type,
      user_id: actor.authUser.id,
    })
    .select("*")
    .single()

  if (error || !data) {
    console.error("[tickets] create failed", {
      code: error?.code ?? null,
      details: error?.details ?? null,
      hint: error?.hint ?? null,
      message: error?.message ?? null,
    })

    return NextResponse.json(
      { message: "Failed to create ticket. Please try again." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ticket: data })
}
