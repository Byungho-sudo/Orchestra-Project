import { NextResponse } from "next/server"
import { getActorDisplayName } from "@/lib/auth/display-identity"
import { ActorAccessError } from "@/lib/auth/actor-types"
import { requireAuthenticatedActor } from "@/lib/auth/require-authenticated-actor"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import {
  isTicketPriority,
  isTicketStatus,
  isTicketType,
} from "@/app/tickets/types"

type CreateTicketBody = {
  description?: string | null
  priority?: string
  title?: string
  type?: string
}

type UpdateTicketBody = CreateTicketBody & {
  id?: string
  status?: string
}

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

  if (!isTicketType(type)) {
    return NextResponse.json(
      { message: "Ticket type is invalid." },
      { status: 400 }
    )
  }

  if (!isTicketPriority(priority)) {
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

export async function PATCH(request: Request) {
  try {
    await requireAuthenticatedActor()
  } catch (error) {
    if (error instanceof ActorAccessError) {
      return NextResponse.json(
        { message: "Authentication is required." },
        { status: error.code === "UNAUTHENTICATED" ? 401 : 403 }
      )
    }

    throw error
  }

  const body = (await request.json().catch(() => null)) as UpdateTicketBody | null
  const id = body?.id?.trim() ?? ""
  const title = body?.title?.trim() ?? ""
  const description = body?.description?.trim() || null
  const type = body?.type ?? ""
  const priority = body?.priority ?? ""
  const status = body?.status ?? ""

  if (!id) {
    return NextResponse.json(
      { message: "Ticket ID is required." },
      { status: 400 }
    )
  }

  if (!title) {
    return NextResponse.json(
      { message: "Title is required." },
      { status: 400 }
    )
  }

  if (!isTicketType(type)) {
    return NextResponse.json(
      { message: "Ticket type is invalid." },
      { status: 400 }
    )
  }

  if (!isTicketPriority(priority)) {
    return NextResponse.json(
      { message: "Ticket priority is invalid." },
      { status: 400 }
    )
  }

  if (!isTicketStatus(status)) {
    return NextResponse.json(
      { message: "Ticket status is invalid." },
      { status: 400 }
    )
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("tickets")
    .update({
      description,
      priority,
      status,
      title,
      type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error || !data) {
    console.error("[tickets] update failed", {
      code: error?.code ?? null,
      details: error?.details ?? null,
      hint: error?.hint ?? null,
      message: error?.message ?? null,
      ticketId: id,
    })

    return NextResponse.json(
      { message: "Failed to update ticket. Please try again." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ticket: data })
}
