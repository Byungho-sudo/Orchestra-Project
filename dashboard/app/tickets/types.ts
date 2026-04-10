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
}

export const emptyTicketDraft: TicketDraft = {
  title: "",
  description: "",
  type: "improvement",
  priority: "medium",
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

export function getTicketTypeBadgeClassName(type: TicketType) {
  switch (type) {
    case "bug":
      return "border-rose-200 bg-rose-50 text-rose-700"
    case "feature":
      return "border-indigo-200 bg-indigo-50 text-indigo-700"
    case "improvement":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "refactor":
      return "border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

export function getTicketPriorityBadgeClassName(priority: TicketPriority) {
  switch (priority) {
    case "high":
      return "border-rose-200 bg-rose-50 text-rose-700"
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "low":
      return "border-slate-200 bg-slate-50 text-slate-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}
