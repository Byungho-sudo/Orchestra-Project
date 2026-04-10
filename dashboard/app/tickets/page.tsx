"use client"

import { AppShell } from "@/app/components/project-dashboard/AppShell"
import { useCurrentUser } from "@/lib/use-current-user"
import { useTickets } from "./useTickets"
import {
  getTicketPriorityBadgeClassName,
  getTicketPriorityLabel,
  getTicketStatusLabel,
  getTicketTypeBadgeClassName,
  getTicketTypeLabel,
  ticketPriorityOptions,
  ticketStatusFilterOptions,
  ticketStatusOptions,
  ticketTypeOptions,
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
  onStatusChange,
}: {
  ticket: TicketRecord
  isUpdating: boolean
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

        <div className="w-full shrink-0 sm:w-44">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            value={ticket.status}
            onChange={(event) =>
              onStatusChange(event.target.value as TicketStatus)
            }
            disabled={isUpdating}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ticketStatusOptions.map((statusOption) => (
              <option key={statusOption.value} value={statusOption.value}>
                {statusOption.label}
              </option>
            ))}
          </select>
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

export default function TicketsPage() {
  const { currentUser, isLoading: isAuthLoading, logout } = useCurrentUser()
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
    setStatusFilter,
    statusFilter,
    tickets,
    updateTicketStatus,
    updatingTicketId,
  } = useTickets()

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

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Short summary of the issue or idea"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Add the context while it's fresh."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Type
                  </label>
                  <select
                    value={draft.type}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        type: event.target.value as typeof currentDraft.type,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    {ticketTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Priority
                  </label>
                  <select
                    value={draft.priority}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        priority: event.target.value as typeof currentDraft.priority,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    {ticketPriorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-600">{error}</p>
              ) : null}

              <button
                type="button"
                onClick={() => void createTicket()}
                disabled={isCreating}
                className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Saving..." : "Add Ticket"}
              </button>
            </div>
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
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {group.label}
                      </h3>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {group.tickets.length}
                      </span>
                    </div>

                    {group.tickets.length === 0 ? (
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
                            onStatusChange={(status) =>
                              void updateTicketStatus(ticket.id, status)
                            }
                          />
                        ))}
                      </div>
                    )}
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
                    onStatusChange={(status) =>
                      void updateTicketStatus(ticket.id, status)
                    }
                  />
                ))}
              </section>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
