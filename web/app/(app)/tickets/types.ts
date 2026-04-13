export type TicketType = "bug" | "feature" | "improvement" | "refactor"
export type TicketPriority = "low" | "medium" | "high"
export type TicketStatus = "inbox" | "planned" | "in_progress" | "done"
export type TicketStatusFilter = TicketStatus | "all"
export type TicketCreatorKind = "user" | "guest"

export type TicketRecord = {
  id: string
  user_id: string | null
  creator_kind: TicketCreatorKind
  creator_display_name: string
  title: string
  description: string | null
  type: TicketType
  priority: TicketPriority
  status: TicketStatus
  created_at: string
  updated_at: string
}

export type TicketDraft = {
  title: string
  description: string
  type: TicketType
  priority: TicketPriority
  status: TicketStatus
}

export const emptyTicketDraft: TicketDraft = {
  title: "",
  description: "",
  type: "improvement",
  priority: "medium",
  status: "inbox",
}

export const ticketTypeOptions: Array<{ value: TicketType; label: string }> = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "refactor", label: "Refactor" },
]

export const ticketPriorityOptions: Array<{
  value: TicketPriority
  label: string
}> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

export const ticketStatusOptions: Array<{ value: TicketStatus; label: string }> =
  [
    { value: "inbox", label: "Inbox" },
    { value: "planned", label: "Planned" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ]

export const ticketStatusFilterOptions: Array<{
  value: TicketStatusFilter
  label: string
}> = [{ value: "all", label: "All" }, ...ticketStatusOptions]

export function getTicketTypeLabel(type: TicketType) {
  return ticketTypeOptions.find((option) => option.value === type)?.label ?? type
}

export function getTicketPriorityLabel(priority: TicketPriority) {
  return (
    ticketPriorityOptions.find((option) => option.value === priority)?.label ??
    priority
  )
}

export function getTicketStatusLabel(status: TicketStatus) {
  return (
    ticketStatusOptions.find((option) => option.value === status)?.label ?? status
  )
}

export function isTicketType(value: string): value is TicketType {
  return ticketTypeOptions.some((option) => option.value === value)
}

export function isTicketPriority(value: string): value is TicketPriority {
  return ticketPriorityOptions.some((option) => option.value === value)
}

export function isTicketStatus(value: string): value is TicketStatus {
  return ticketStatusOptions.some((option) => option.value === value)
}

export function getTicketTypeBadgeClassName(type: TicketType) {
  switch (type) {
    case "bug":
      return "border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-soft)] text-[var(--color-status-danger)]"
    case "feature":
      return "border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
    case "improvement":
      return "border-[var(--color-status-success-border)] bg-[var(--color-status-success-soft)] text-[var(--color-status-success)]"
    case "refactor":
      return "border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning)]"
    default:
      return "border-[var(--color-status-neutral-border)] bg-[var(--color-status-neutral-soft)] text-[var(--color-status-neutral)]"
  }
}

export function getTicketPriorityBadgeClassName(priority: TicketPriority) {
  switch (priority) {
    case "high":
      return "border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-soft)] text-[var(--color-status-danger)]"
    case "medium":
      return "border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning)]"
    case "low":
      return "border-[var(--color-status-neutral-border)] bg-[var(--color-status-neutral-soft)] text-[var(--color-status-neutral)]"
    default:
      return "border-[var(--color-status-neutral-border)] bg-[var(--color-status-neutral-soft)] text-[var(--color-status-neutral)]"
  }
}
