"use client"

import { useState } from "react"
import { AppShell } from "@/app/components/project-dashboard/AppShell"
import { Modal } from "@/app/components/ui/Modal"
import { useCurrentUser } from "@/lib/use-current-user"
import { TicketForm } from "./TicketForm"
import { useTickets } from "./useTickets"
import {
  getTicketPriorityBadgeClassName,
  getTicketPriorityLabel,
  getTicketStatusLabel,
  getTicketTypeBadgeClassName,
  getTicketTypeLabel,
  ticketStatusFilterOptions,
  ticketStatusOptions,
  type TicketDraft,
  type TicketRecord,
  type TicketStatus,
} from "./types"

function formatTicketTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function TicketCard({
  ticket,
  isUpdating,
  onEdit,
  onStatusChange,
}: {
  ticket: TicketRecord
  isUpdating: boolean
  onEdit: () => void
  onStatusChange: (status: TicketStatus) => void
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              {ticket.title}
            </h2>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getTicketTypeBadgeClassName(
                ticket.type
              )}`}
            >
              {getTicketTypeLabel(ticket.type)}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getTicketPriorityBadgeClassName(
                ticket.priority
              )}`}
            >
              {getTicketPriorityLabel(ticket.priority)}
            </span>
          </div>

          {ticket.description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {ticket.description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              No additional notes yet.
            </p>
          )}
        </div>

        <div className="w-full shrink-0 sm:w-52">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <div className="flex items-center gap-2">
            <select
              value={ticket.status}
              onChange={(event) =>
                onStatusChange(event.target.value as TicketStatus)
              }
              disabled={isUpdating}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ticketStatusOptions.map((statusOption) => (
                <option key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit ticket"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.38 1.08V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.08-.38H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .38-1.08V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.17.38.4.72.6 1 .28.3.67.48 1.08.5H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.5Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex w-full items-center justify-between gap-3 text-xs font-medium text-slate-500">
        <p className="uppercase tracking-wide">
          Added {formatTicketTimestamp(ticket.created_at)}
        </p>
        <p className="truncate text-right">
          Created by {ticket.creator_display_name}
        </p>
      </div>
    </article>
  )
}

function getTicketDraft(ticket: TicketRecord): TicketDraft {
  return {
    description: ticket.description ?? "",
    priority: ticket.priority,
    status: ticket.status,
    title: ticket.title,
    type: ticket.type,
  }
}

export default function TicketsPage() {
  const { currentUser, isLoading: isAuthLoading, logout } = useCurrentUser()
  const [editingTicket, setEditingTicket] = useState<TicketRecord | null>(null)
  const [editDraft, setEditDraft] = useState<TicketDraft | null>(null)
  const [expandedStatusGroups, setExpandedStatusGroups] = useState<
    Set<TicketStatus>
  >(() => new Set(["inbox"]))
  const {
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
    updateTicket,
    updateTicketStatus,
    updatingTicketId,
  } = useTickets()

  function openEditTicket(ticket: TicketRecord) {
    setError("")
    setEditingTicket(ticket)
    setEditDraft(getTicketDraft(ticket))
  }

  function closeEditTicket() {
    if (editingTicket && updatingTicketId === editingTicket.id) return

    setEditingTicket(null)
    setEditDraft(null)
  }

  async function saveEditedTicket() {
    if (!editingTicket || !editDraft) return

    const wasUpdated = await updateTicket(editingTicket.id, editDraft)

    if (!wasUpdated) return

    setEditingTicket(null)
    setEditDraft(null)
  }

  function toggleStatusGroup(status: TicketStatus) {
    setExpandedStatusGroups((currentGroups) => {
      const nextGroups = new Set(currentGroups)

      if (nextGroups.has(status)) {
        nextGroups.delete(status)
      } else {
        nextGroups.add(status)
      }

      return nextGroups
    })
  }

  return (
    <AppShell title="Tickets" currentUser={currentUser} onLogout={logout}>
      <main className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Tickets
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Capture bugs, ideas, polish, and cleanup work
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            Keep Orchestra improvements in one lightweight queue so you can log
            them quickly from desktop or phone without breaking flow.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Quick Capture
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Add ticket
                </h2>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status: Inbox
              </div>
            </div>

            <TicketForm
              draft={draft}
              error={error}
              isSubmitting={isCreating}
              mode="create"
              onChange={setDraft}
              onSubmit={() => void createTicket()}
            />
          </div>

          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Queue
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ticketStatusFilterOptions.map((option) => {
                    const isActive = statusFilter === option.value
                    const count =
                      option.value === "all"
                        ? tickets.length
                        : countsByStatus[option.value]

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatusFilter(option.value)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        {option.label} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            {isLoading || isAuthLoading ? (
              <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                Loading tickets...
              </section>
            ) : statusFilter === "all" ? (
              <div className="space-y-5">
                {groupedTickets.map((group) => (
                  <section
                    key={group.status}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <button
                      type="button"
                      aria-expanded={expandedStatusGroups.has(group.status)}
                      onClick={() => toggleStatusGroup(group.status)}
                      className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      <span className="min-w-0 text-lg font-semibold text-slate-900">
                        {group.label}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {group.tickets.length}
                        </span>
                        <span
                          aria-hidden="true"
                          className={`text-base text-slate-500 transition-transform ${
                            expandedStatusGroups.has(group.status)
                              ? "rotate-90"
                              : "rotate-0"
                          }`}
                        >
                          &gt;
                        </span>
                      </span>
                    </button>

                    {expandedStatusGroups.has(group.status) ? (
                      group.tickets.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">
                          No tickets in {group.label.toLowerCase()}.
                        </p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {group.tickets.map((ticket) => (
                            <TicketCard
                              key={ticket.id}
                              ticket={ticket}
                              isUpdating={updatingTicketId === ticket.id}
                              onEdit={() => openEditTicket(ticket)}
                              onStatusChange={(status) =>
                                void updateTicketStatus(ticket.id, status)
                              }
                            />
                          ))}
                        </div>
                      )
                    ) : null}
                  </section>
                ))}
              </div>
            ) : filteredTickets.length === 0 ? (
              <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                No tickets in {getTicketStatusLabel(statusFilter)} yet.
              </section>
            ) : (
              <section className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    isUpdating={updatingTicketId === ticket.id}
                    onEdit={() => openEditTicket(ticket)}
                    onStatusChange={(status) =>
                      void updateTicketStatus(ticket.id, status)
                    }
                  />
                ))}
              </section>
            )}
          </div>
        </section>

        {editingTicket && editDraft ? (
          <Modal
            hasUnsavedChanges={
              JSON.stringify(editDraft) !==
              JSON.stringify(getTicketDraft(editingTicket))
            }
            isDismissDisabled={updatingTicketId === editingTicket.id}
            onClose={closeEditTicket}
          >
            {({ requestClose }) => (
              <>
                <h2 className="text-xl font-semibold text-slate-900">
                  Edit Ticket
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Update the ticket details and save your changes.
                </p>

                <TicketForm
                  draft={editDraft}
                  error={error}
                  isSubmitting={updatingTicketId === editingTicket.id}
                  mode="edit"
                  onCancel={requestClose}
                  onChange={setEditDraft}
                  onSubmit={() => void saveEditedTicket()}
                />
              </>
            )}
          </Modal>
        ) : null}
      </main>
    </AppShell>
  )
}
