"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ModalShell } from "@/features/projects/ModalShell"
import { calculateProjectProgressFromTimeline } from "@/lib/project-progress"
import { fieldCardClassName, isProjectModuleInstanceId } from "./helpers"
import {
  emptyTimelineEventDraft,
  useTimelineEvents,
  type ProjectTimelineEventRecord,
  type TimelineEventDraft,
  type TimelineEventStatus,
} from "./hooks/useTimelineEvents"

const timelineStatusOptions: Array<{
  label: string
  value: TimelineEventStatus
}> = [
  { label: "Planned", value: "planned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Blocked", value: "blocked" },
]

function getTimelineStatusBadgeClassName(status: TimelineEventStatus) {
  if (status === "completed") return "bg-green-100 text-green-700"
  if (status === "in_progress") return "bg-blue-100 text-blue-700"
  if (status === "blocked") return "bg-red-100 text-red-700"
  return "bg-slate-100 text-slate-600"
}

function getTimelineDateRangeLabel(event: ProjectTimelineEventRecord) {
  return event.end_date
    ? `${event.start_date} - ${event.end_date}`
    : event.start_date
}

function createTimelineEventDraft(
  event?: ProjectTimelineEventRecord | null
): TimelineEventDraft {
  if (!event) return emptyTimelineEventDraft

  return {
    name: event.name,
    start_date: event.start_date,
    end_date: event.end_date ?? "",
    description: event.description ?? "",
    status: event.status,
  }
}

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

const timelineFormId = "timeline-module-form"

export function TimelineModule({
  moduleId,
  projectId,
}: {
  moduleId: string | null
  projectId: number
}) {
  const persistedModuleId = isProjectModuleInstanceId(moduleId ?? "")
  const {
    createEvent,
    deleteEvent,
    error,
    events,
    isCreating,
    isLoading,
    moveEvent,
    movingEventId,
    savingEventId,
    schemaUnavailableMessage,
    updateEvent,
  } = useTimelineEvents({
    enabled: persistedModuleId,
    moduleId: persistedModuleId ? moduleId : null,
    projectId,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ProjectTimelineEventRecord | null>(
    null
  )
  const [draft, setDraft] = useState<TimelineEventDraft>(emptyTimelineEventDraft)
  const primaryInputRef = useRef<HTMLInputElement | null>(null)
  const progressSummary = useMemo(
    () => calculateProjectProgressFromTimeline(events),
    [events]
  )

  const hasDraftChanges = useMemo(() => {
    const initialDraft = createTimelineEventDraft(editingEvent)

    return JSON.stringify(draft) !== JSON.stringify(initialDraft)
  }, [draft, editingEvent])

  const openCreateModal = useCallback(() => {
    setEditingEvent(null)
    setDraft({
      ...emptyTimelineEventDraft,
      start_date: getTodayDateInputValue(),
    })
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback((event: ProjectTimelineEventRecord) => {
    setEditingEvent(event)
    setDraft(createTimelineEventDraft(event))
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    if (isCreating || Boolean(savingEventId)) return

    setIsModalOpen(false)
    setEditingEvent(null)
    setDraft(emptyTimelineEventDraft)
  }, [isCreating, savingEventId])

  useEffect(() => {
    if (!isModalOpen) return

    const focusTimeout = setTimeout(() => {
      primaryInputRef.current?.focus()
      primaryInputRef.current?.select()
    }, 0)

    return () => {
      clearTimeout(focusTimeout)
    }
  }, [isModalOpen, editingEvent])

  const handleDraftChange = useCallback(
    (field: keyof TimelineEventDraft, value: string) => {
      setDraft((currentDraft) => ({
        ...currentDraft,
        [field]: value,
      }))
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    const didSave = editingEvent
      ? await updateEvent(editingEvent.id, draft)
      : await createEvent(draft)

    if (didSave) {
      if (editingEvent) {
        closeModal()
        return
      }

      setDraft({
        ...emptyTimelineEventDraft,
        start_date: draft.start_date || getTodayDateInputValue(),
      })
      primaryInputRef.current?.focus()
    }
  }, [closeModal, createEvent, draft, editingEvent, updateEvent])

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Timeline
        </p>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={
            !persistedModuleId || isCreating || Boolean(schemaUnavailableMessage)
          }
          className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add Milestone
        </button>
      </div>

      {!persistedModuleId && (
        <p className="mt-4 text-sm text-slate-500">
          Timeline is still syncing to the saved workspace module.
        </p>
      )}

      {schemaUnavailableMessage && (
        <p className="mt-4 text-sm font-medium text-amber-700">
          {schemaUnavailableMessage}
        </p>
      )}

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 space-y-4">
        <div className={fieldCardClassName}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Timeline Progress
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Derived from completed milestones in this timeline.
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-semibold text-slate-900">
                {progressSummary.progress_percent}%
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {progressSummary.status.replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width]"
              style={{ width: `${progressSummary.progress_percent}%` }}
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading milestones...</p>
        ) : events.length === 0 ? (
          <div className={fieldCardClassName}>
            <p className="text-sm text-slate-500">
              No milestones added yet. Add one to start building the production timeline.
            </p>
          </div>
        ) : (
          events.map((event, eventIndex) => (
            <div key={event.id} className="relative pl-8">
              {eventIndex < events.length - 1 && (
                <span className="absolute left-[11px] top-8 h-[calc(100%+1rem)] w-px bg-slate-200" />
              )}
              <span className="absolute left-0 top-5 h-6 w-6 rounded-full border border-indigo-200 bg-indigo-50" />

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {event.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {getTimelineDateRangeLabel(event)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getTimelineStatusBadgeClassName(
                      event.status
                    )}`}
                  >
                    {timelineStatusOptions.find((option) => option.value === event.status)
                      ?.label ?? event.status}
                  </span>
                </div>

                {event.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {event.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <select
                    value={event.status}
                    onChange={(currentEvent) => {
                      void updateEvent(event.id, {
                        name: event.name,
                        start_date: event.start_date,
                        end_date: event.end_date ?? "",
                        description: event.description ?? "",
                        status: currentEvent.target.value as TimelineEventStatus,
                      })
                    }}
                    disabled={Boolean(savingEventId)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {timelineStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => openEditModal(event)}
                    disabled={Boolean(savingEventId)}
                    className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => void moveEvent(event.id, "up")}
                    disabled={eventIndex === 0 || movingEventId === event.id}
                    className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Move Up
                  </button>

                  <button
                    type="button"
                    onClick={() => void moveEvent(event.id, "down")}
                    disabled={
                      eventIndex === events.length - 1 || movingEventId === event.id
                    }
                    className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Move Down
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteEvent(event.id)}
                    disabled={savingEventId === event.id}
                    className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingEventId === event.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <ModalShell
          hasUnsavedChanges={hasDraftChanges}
          isDismissDisabled={isCreating || Boolean(savingEventId)}
          panelClassName="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          onClose={closeModal}
        >
          {({ requestClose }) => (
            <>
              <h2 className="text-xl font-bold text-slate-900">
                {editingEvent ? "Edit Milestone" : "Add Milestone"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Capture key production milestones and keep the module ordered.
              </p>

              <form
                id={timelineFormId}
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleSubmit()
                }}
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Milestone Name
                  </label>
                  <input
                    ref={primaryInputRef}
                    type="text"
                    value={draft.name}
                    onChange={(event) =>
                      handleDraftChange("name", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={draft.start_date}
                      onChange={(event) =>
                        handleDraftChange("start_date", event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={draft.end_date}
                      onChange={(event) =>
                        handleDraftChange("end_date", event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      handleDraftChange("status", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    {timelineStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={draft.description}
                    onChange={(event) =>
                      handleDraftChange("description", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
              </form>

              {error && (
                <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={isCreating || Boolean(savingEventId)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form={timelineFormId}
                  disabled={isCreating || Boolean(savingEventId)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating || Boolean(savingEventId)
                    ? "Saving..."
                    : editingEvent
                      ? "Save Changes"
                      : "Add Milestone"}
                </button>
              </div>
            </>
          )}
        </ModalShell>
      )}
    </>
  )
}
