"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  emptyTicketDraft,
  ticketStatusOptions,
  type TicketDraft,
  type TicketRecord,
  type TicketStatus,
  type TicketStatusFilter,
} from "./types"

function normalizeTickets(tickets: TicketRecord[]) {
  return [...tickets].sort((firstTicket, secondTicket) =>
    secondTicket.created_at.localeCompare(firstTicket.created_at)
  )
}

export function useTickets({ userId }: { userId: string | null }) {
  const [tickets, setTickets] = useState<TicketRecord[]>([])
  const [draft, setDraft] = useState<TicketDraft>(emptyTicketDraft)
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const loadTickets = useCallback(async () => {
    setIsLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false })

    setIsLoading(false)

    if (error) {
      setError("Failed to load tickets. Please refresh and try again.")
      return
    }

    setTickets(normalizeTickets((data as TicketRecord[]) || []))
  }, [])

  useEffect(() => {
    void loadTickets()
  }, [loadTickets])

  const createTicket = useCallback(async () => {
    if (!draft.title.trim()) {
      setError("Title is required.")
      return false
    }

    setIsCreating(true)
    setError("")

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        user_id: userId,
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        type: draft.type,
        priority: draft.priority,
        status: "inbox",
      })
      .select("*")
      .single()

    setIsCreating(false)

    if (error || !data) {
      setError("Failed to create ticket. Please try again.")
      return false
    }

    setTickets((currentTickets) =>
      normalizeTickets([data as TicketRecord, ...currentTickets])
    )
    setDraft((currentDraft) => ({
      ...currentDraft,
      title: "",
      description: "",
    }))
    setStatusFilter("all")

    return true
  }, [draft, userId])

  const updateTicketStatus = useCallback(
    async (ticketId: string, status: TicketStatus) => {
      setUpdatingTicketId(ticketId)
      setError("")

      const { data, error } = await supabase
        .from("tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", ticketId)
        .select("*")
        .single()

      setUpdatingTicketId(null)

      if (error || !data) {
        setError("Failed to update ticket status. Please try again.")
        return
      }

      setTickets((currentTickets) =>
        normalizeTickets(
          currentTickets.map((ticket) =>
            ticket.id === ticketId ? (data as TicketRecord) : ticket
          )
        )
      )
    },
    []
  )

  const filteredTickets = useMemo(() => {
    if (statusFilter === "all") return tickets

    return tickets.filter((ticket) => ticket.status === statusFilter)
  }, [statusFilter, tickets])

  const groupedTickets = useMemo(
    () =>
      ticketStatusOptions.map((statusOption) => ({
        status: statusOption.value,
        label: statusOption.label,
        tickets: tickets.filter((ticket) => ticket.status === statusOption.value),
      })),
    [tickets]
  )

  const countsByStatus = useMemo(() => {
    return ticketStatusOptions.reduce<Record<TicketStatus, number>>(
      (counts, statusOption) => {
        counts[statusOption.value] = tickets.filter(
          (ticket) => ticket.status === statusOption.value
        ).length
        return counts
      },
      {
        done: 0,
        inbox: 0,
        in_progress: 0,
        planned: 0,
      }
    )
  }, [tickets])

  return {
    countsByStatus,
    createTicket,
    draft,
    error,
    filteredTickets,
    groupedTickets,
    isCreating,
    isLoading,
    setDraft,
    setError,
    setStatusFilter,
    statusFilter,
    tickets,
    updateTicketStatus,
    updatingTicketId,
  }
}
