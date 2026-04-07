"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  isProjectTimelineEventsSchemaMissingError,
  logSupabaseMutationResult,
} from "../helpers"

export type TimelineEventStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "blocked"

export type ProjectTimelineEventRecord = {
  id: string
  project_id: number
  module_id: string
  name: string
  start_date: string
  end_date: string | null
  description: string | null
  status: TimelineEventStatus
  order: number
  created_at: string
  updated_at: string
}

export type TimelineEventDraft = {
  name: string
  start_date: string
  end_date: string
  description: string
  status: TimelineEventStatus
}

export const emptyTimelineEventDraft: TimelineEventDraft = {
  name: "",
  start_date: "",
  end_date: "",
  description: "",
  status: "planned",
}

function createTemporaryTimelineEventId() {
  return `temp-timeline-event-${Date.now()}-${Math.random()}`
}

function normalizeTimelineEvents(events: ProjectTimelineEventRecord[]) {
  return [...events]
    .sort((firstEvent, secondEvent) => {
      if (firstEvent.order !== secondEvent.order) {
        return firstEvent.order - secondEvent.order
      }

      return firstEvent.created_at.localeCompare(secondEvent.created_at)
    })
    .map((event, eventIndex) => ({
      ...event,
      order: eventIndex,
    }))
}

export function useTimelineEvents({
  enabled,
  moduleId,
  projectId,
}: {
  enabled: boolean
  moduleId: string | null
  projectId: number
}) {
  const [events, setEvents] = useState<ProjectTimelineEventRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [savingEventId, setSavingEventId] = useState<string | null>(null)
  const [movingEventId, setMovingEventId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [schemaUnavailableMessage, setSchemaUnavailableMessage] = useState("")

  const sortedEvents = useMemo(() => normalizeTimelineEvents(events), [events])

  const loadTimelineEvents = useCallback(async () => {
    if (!enabled || !moduleId) {
      setEvents([])
      setError("")
      setSchemaUnavailableMessage("")
      return
    }

    setIsLoading(true)
    setError("")
    setSchemaUnavailableMessage("")

    const { data, error, status, statusText } = await supabase
      .from("project_timeline_events")
      .select("*")
      .eq("project_id", projectId)
      .eq("module_id", moduleId)
      .order("order", { ascending: true })
      .order("created_at", { ascending: true })

    logSupabaseMutationResult("Timeline events fetch", {
      data,
      error,
      status,
      statusText,
    })

    setIsLoading(false)

    if (error) {
      if (isProjectTimelineEventsSchemaMissingError(error)) {
        setSchemaUnavailableMessage(
          "Timeline is unavailable until the project_timeline_events table is created."
        )
        setEvents([])
        return
      }

      setError("Failed to load timeline milestones. Please refresh and try again.")
      return
    }

    setEvents(normalizeTimelineEvents((data as ProjectTimelineEventRecord[]) || []))
  }, [enabled, moduleId, projectId])

  useEffect(() => {
    void loadTimelineEvents()
  }, [loadTimelineEvents])

  const validateDraft = useCallback((draft: TimelineEventDraft) => {
    if (!draft.name.trim()) return "Milestone name is required."
    if (!draft.start_date.trim()) return "Start date is required."
    if (draft.end_date.trim() && draft.end_date < draft.start_date) {
      return "End date must be on or after the start date."
    }

    return ""
  }, [])

  const createEvent = useCallback(
    async (draft: TimelineEventDraft) => {
      if (!enabled || !moduleId || isCreating) return false

      const validationError = validateDraft(draft)

      if (validationError) {
        setError(validationError)
        return false
      }

      setError("")
      setIsCreating(true)

      const temporaryId = createTemporaryTimelineEventId()
      const temporaryEvent: ProjectTimelineEventRecord = {
        id: temporaryId,
        project_id: projectId,
        module_id: moduleId,
        name: draft.name.trim(),
        start_date: draft.start_date,
        end_date: draft.end_date.trim() || null,
        description: draft.description.trim() || null,
        status: draft.status,
        order: sortedEvents.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setEvents((currentEvents) => [...currentEvents, temporaryEvent])

      const { data, error, status, statusText } = await supabase
        .from("project_timeline_events")
        .insert({
          project_id: projectId,
          module_id: moduleId,
          name: draft.name.trim(),
          start_date: draft.start_date,
          end_date: draft.end_date.trim() || null,
          description: draft.description.trim() || null,
          status: draft.status,
          order: sortedEvents.length,
        })
        .select("*")
        .single()

      logSupabaseMutationResult("Timeline event insert", {
        data,
        error,
        status,
        statusText,
      })

      setIsCreating(false)

      if (error) {
        setEvents((currentEvents) =>
          currentEvents.filter((event) => event.id !== temporaryId)
        )
        setError("Failed to create milestone. Please try again.")
        return false
      }

      setEvents((currentEvents) =>
        normalizeTimelineEvents(
          currentEvents.map((event) =>
            event.id === temporaryId
              ? (data as ProjectTimelineEventRecord)
              : event
          )
        )
      )

      return true
    },
    [enabled, isCreating, moduleId, projectId, sortedEvents.length, validateDraft]
  )

  const updateEvent = useCallback(
    async (eventId: string, draft: TimelineEventDraft) => {
      if (!enabled || !moduleId || savingEventId) return false

      const validationError = validateDraft(draft)

      if (validationError) {
        setError(validationError)
        return false
      }

      const previousEvents = events
      const optimisticEvents = previousEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              name: draft.name.trim(),
              start_date: draft.start_date,
              end_date: draft.end_date.trim() || null,
              description: draft.description.trim() || null,
              status: draft.status,
            }
          : event
      )

      setError("")
      setSavingEventId(eventId)
      setEvents(optimisticEvents)

      const { data, error, status, statusText } = await supabase
        .from("project_timeline_events")
        .update({
          name: draft.name.trim(),
          start_date: draft.start_date,
          end_date: draft.end_date.trim() || null,
          description: draft.description.trim() || null,
          status: draft.status,
        })
        .eq("id", eventId)
        .eq("project_id", projectId)
        .eq("module_id", moduleId)
        .select("*")
        .single()

      logSupabaseMutationResult("Timeline event update", {
        data,
        error,
        status,
        statusText,
      })

      setSavingEventId(null)

      if (error) {
        setEvents(previousEvents)
        setError("Failed to update milestone. Please try again.")
        return false
      }

      setEvents((currentEvents) =>
        normalizeTimelineEvents(
          currentEvents.map((event) =>
            event.id === eventId ? (data as ProjectTimelineEventRecord) : event
          )
        )
      )

      return true
    },
    [enabled, events, moduleId, projectId, savingEventId, validateDraft]
  )

  const reorderEvents = useCallback(
    async (
      nextEvents: ProjectTimelineEventRecord[],
      activeEventId: string | null
    ) => {
      if (!enabled || !moduleId) return false

      const previousEvents = events
      const normalizedEvents = normalizeTimelineEvents(nextEvents)

      setError("")
      setMovingEventId(activeEventId)
      setEvents(normalizedEvents)

      const { error, status, statusText } = await supabase
        .from("project_timeline_events")
        .upsert(
          normalizedEvents.map((event, eventIndex) => ({
            id: event.id,
            project_id: projectId,
            module_id: moduleId,
            name: event.name,
            start_date: event.start_date,
            end_date: event.end_date,
            description: event.description,
            status: event.status,
            order: eventIndex,
          })),
          { onConflict: "id" }
        )

      logSupabaseMutationResult("Timeline events reorder", {
        data: null,
        error,
        status,
        statusText,
      })

      setMovingEventId(null)

      if (error) {
        setEvents(previousEvents)
        setError("Failed to reorder milestones. Please try again.")
        return false
      }

      return true
    },
    [enabled, events, moduleId, projectId]
  )

  const moveEvent = useCallback(
    async (eventId: string, direction: "up" | "down") => {
      const currentIndex = sortedEvents.findIndex((event) => event.id === eventId)

      if (currentIndex === -1) return false

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1

      if (targetIndex < 0 || targetIndex >= sortedEvents.length) {
        return false
      }

      const reorderedEvents = [...sortedEvents]
      const [movedEvent] = reorderedEvents.splice(currentIndex, 1)
      reorderedEvents.splice(targetIndex, 0, movedEvent)

      return reorderEvents(reorderedEvents, eventId)
    },
    [reorderEvents, sortedEvents]
  )

  const deleteEvent = useCallback(
    async (eventId: string) => {
      if (!enabled || !moduleId || savingEventId === eventId) return false

      const previousEvents = events
      const nextEvents = previousEvents.filter((event) => event.id !== eventId)

      setError("")
      setSavingEventId(eventId)
      setEvents(normalizeTimelineEvents(nextEvents))

      const { error, status, statusText } = await supabase
        .from("project_timeline_events")
        .delete()
        .eq("id", eventId)
        .eq("project_id", projectId)
        .eq("module_id", moduleId)

      logSupabaseMutationResult("Timeline event delete", {
        data: null,
        error,
        status,
        statusText,
      })

      setSavingEventId(null)

      if (error) {
        setEvents(previousEvents)
        setError("Failed to delete milestone. Please try again.")
        return false
      }

      if (nextEvents.length > 0) {
        await reorderEvents(nextEvents, null)
      }

      return true
    },
    [enabled, events, moduleId, projectId, reorderEvents, savingEventId]
  )

  return {
    createEvent,
    deleteEvent,
    emptyTimelineEventDraft,
    error,
    events: sortedEvents,
    isCreating,
    isLoading,
    moveEvent,
    movingEventId,
    savingEventId,
    schemaUnavailableMessage,
    updateEvent,
  }
}
