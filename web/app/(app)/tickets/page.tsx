"use client"

import { useEffect, useRef, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Select } from "@/components/ui/Select"
import { Modal } from "@/components/ui/Modal"
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
    <Card
      as="article"
      className="bg-[var(--theme-card)] p-4 transition-[border-color,box-shadow] duration-200 hover:shadow-[var(--color-card-shadow-hover)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div>
            <h2 className="text-base font-semibold text-[var(--theme-card-foreground)]">
              {ticket.title}
            </h2>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-card-muted-foreground)]">
              {ticket.description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-card-muted-foreground)]/75">
              No additional notes yet.
            </p>
          )}
        </div>

        <div className="w-full shrink-0 sm:w-52">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-card-muted-foreground)]">
            Status
          </label>
          <div className="flex items-center gap-2">
            <Select
              value={ticket.status}
              onChange={(event) =>
                onStatusChange(event.target.value as TicketStatus)
              }
              disabled={isUpdating}
              className="min-w-0 flex-1 bg-[var(--color-background)] text-[var(--theme-card-foreground)] shadow-none"
            >
              {ticketStatusOptions.map((statusOption) => (
                <option key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </option>
              ))}
            </Select>

            <Button
              onClick={onEdit}
              aria-label="Edit issue"
              variant="secondary"
              size="icon"
              className="h-9 w-9 shrink-0 bg-[var(--color-background)] text-[var(--color-card-muted-foreground)] shadow-none"
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
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex w-full items-center justify-between gap-3 text-xs font-medium text-[var(--color-card-muted-foreground)]">
        <p className="uppercase tracking-wide">
          Added {formatTicketTimestamp(ticket.created_at)}
        </p>
        <p className="truncate text-right">
          Created by {ticket.creator_display_name}
        </p>
      </div>
    </Card>
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
  const quickCaptureRef = useRef<HTMLDivElement | null>(null)
  const [editingTicket, setEditingTicket] = useState<TicketRecord | null>(null)
  const [editDraft, setEditDraft] = useState<TicketDraft | null>(null)
  const [showFloatingBackButton, setShowFloatingBackButton] = useState(false)
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

  useEffect(() => {
    function handleScroll() {
      setShowFloatingBackButton(window.scrollY > 520)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  function scrollToQuickCapture() {
    quickCaptureRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <AppShell title="Issues" currentUser={currentUser} onLogout={logout}>
      <main className="space-y-6">
        <Card as="section" padding="lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-card-muted-foreground)]">
            Issues
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--theme-card-foreground)]">
            Capture bugs, ideas, polish, and cleanup work
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--color-card-muted-foreground)]">
            Keep Orchestra improvements in one lightweight queue so you can log
            them quickly from desktop or phone without breaking flow.
          </p>
        </Card>

        <section className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="self-start">
            <div id="quick-capture" ref={quickCaptureRef} className="scroll-mt-24">
              <Card as="div" padding="md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-card-muted-foreground)]">
                    Quick Capture
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--theme-card-foreground)]">
                    Add issue
                  </h2>
                </div>
                <div className="rounded-full border border-[var(--color-status-neutral-border)] bg-[var(--color-status-neutral-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-status-neutral)]">
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
              </Card>
            </div>

          </div>

          <div className="space-y-4">
            <Card as="section" padding="md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-card-muted-foreground)]">
                    Queue
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--theme-card-foreground)]">
                    {tickets.length} {tickets.length === 1 ? "issue" : "issues"}
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
                      <Button
                        key={option.value}
                        onClick={() => setStatusFilter(option.value)}
                        variant="secondary"
                        className={`min-h-0 rounded-full px-3 py-1.5 text-sm font-medium shadow-none ${
                          isActive
                            ? "border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                            : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-card-muted-foreground)] hover:bg-[var(--color-surface-elevated)]"
                        }`}
                      >
                        {option.label} ({count})
                      </Button>
                    )
                  })}
                </div>
              </div>
            </Card>

            {isLoading || isAuthLoading ? (
              <Card
                as="section"
                padding="lg"
                className="text-sm text-[var(--color-card-muted-foreground)]"
              >
                Loading issues...
              </Card>
            ) : statusFilter === "all" ? (
              <div className="space-y-5">
                {groupedTickets.map((group) => (
                  <Card
                    as="section"
                    key={group.status}
                    padding="md"
                  >
                    <Button
                      variant="ghost"
                      aria-expanded={expandedStatusGroups.has(group.status)}
                      onClick={() => toggleStatusGroup(group.status)}
                      className="flex w-full items-center justify-between gap-3 px-0 py-0 text-left text-[var(--theme-card-foreground)] hover:bg-transparent"
                    >
                      <span className="min-w-0 text-lg font-semibold text-[var(--theme-card-foreground)]">
                        {group.label}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full border border-[var(--color-status-neutral-border)] bg-[var(--color-status-neutral-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-status-neutral)]">
                          {group.tickets.length}
                        </span>
                        <span
                          aria-hidden="true"
                          className={`text-base text-[var(--color-card-muted-foreground)] transition-transform ${
                            expandedStatusGroups.has(group.status)
                              ? "rotate-90"
                              : "rotate-0"
                          }`}
                        >
                          &gt;
                        </span>
                      </span>
                    </Button>

                    {expandedStatusGroups.has(group.status) ? (
                      group.tickets.length === 0 ? (
                        <p className="mt-4 text-sm text-[var(--color-card-muted-foreground)]">
                          No issues in {group.label.toLowerCase()}.
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
                  </Card>
                ))}
              </div>
            ) : filteredTickets.length === 0 ? (
              <Card
                as="section"
                padding="lg"
                className="text-sm text-[var(--color-card-muted-foreground)]"
              >
                No issues in {getTicketStatusLabel(statusFilter)} yet.
              </Card>
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
                <h2 className="text-xl font-semibold text-[var(--theme-card-foreground)]">
                  Edit Issue
                </h2>
                <p className="mt-1 text-sm text-[var(--color-card-muted-foreground)]">
                  Update the issue details and save your changes.
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

        {showFloatingBackButton ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 mx-auto max-w-7xl px-[var(--layout-gap)]">
            <div className="grid grid-cols-1 gap-[var(--layout-gap)] md:grid-cols-[240px_minmax(0,1fr)]">
              <div className="hidden md:block" />
              <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="flex justify-center">
                  <Button
                    onClick={scrollToQuickCapture}
                    aria-label="Back to Issue Form"
                    variant="secondary"
                    className="pointer-events-auto rounded-full border-[var(--color-accent-border)] bg-[var(--theme-card)] text-[var(--color-accent)] shadow-lg hover:bg-[var(--color-accent-soft)]"
                  >
                    Back to Issue Form
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AppShell>
  )
}
