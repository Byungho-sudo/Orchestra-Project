export type DeadlineFilter = "All" | "Overdue" | "Due today" | "Due soon" | "No deadline"

function getDaysUntilDue(dueDate: string | null) {
  if (!dueDate) return null

  const [year, month, day] = dueDate.split("-").map(Number)
  const dueAt = Date.UTC(year, month - 1, day)
  const today = new Date()
  const todayAt = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  return Math.round((dueAt - todayAt) / (1000 * 60 * 60 * 24))
}

export function getDeadlineStatus(dueDate: string | null) {
  const daysUntilDue = getDaysUntilDue(dueDate)

  if (daysUntilDue === null) return "No deadline"
  if (daysUntilDue < 0) return "Overdue"
  if (daysUntilDue === 0) return "Due today"
  if (daysUntilDue <= 7) return "Due soon"

  return `Due in ${daysUntilDue} days`
}

export function getDeadlineFill(dueDate: string | null) {
  const daysUntilDue = getDaysUntilDue(dueDate)

  if (daysUntilDue === null) return 0
  if (daysUntilDue <= 0) return 100
  if (daysUntilDue <= 3) return 90
  if (daysUntilDue <= 7) return 75
  if (daysUntilDue <= 14) return 45
  if (daysUntilDue <= 30) return 20

  return 5
}

export function getDeadlineBarClass(status: string) {
  if (status === "Overdue") return "bg-[var(--color-danger)]"
  if (status === "Due today") return "bg-[var(--color-warning)]"
  if (status === "Due soon") return "bg-[var(--color-warning)]"
  if (status === "No deadline") return "bg-[var(--color-text-muted)]"

  return "bg-[var(--color-upcoming)]"
}

export function getDeadlineBadgeClass(status: string) {
  if (status === "Overdue") {
    return "border-[var(--color-danger)]/12 bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
  }
  if (status === "Due today") {
    return "border-[var(--color-warning)]/12 bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
  }
  if (status === "Due soon") {
    return "border-[var(--color-warning)]/12 bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
  }
  if (status === "No deadline") {
    return "border-[var(--color-card-separator)] bg-[var(--color-card-track)] text-[var(--color-card-muted-foreground)]"
  }

  return "border-[var(--color-upcoming)]/12 bg-[var(--color-upcoming-soft)] text-[var(--color-upcoming)]"
}
