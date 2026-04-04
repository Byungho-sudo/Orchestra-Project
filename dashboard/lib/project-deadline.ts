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
  if (status === "Overdue") return "bg-red-700"
  if (status === "Due today") return "bg-orange-600"
  if (status === "Due soon") return "bg-amber-500"
  if (status === "No deadline") return "bg-gray-400"

  return "bg-blue-700"
}

export function getDeadlineBadgeClass(status: string) {
  if (status === "Overdue") return "bg-red-100 text-red-700"
  if (status === "Due today") return "bg-orange-100 text-orange-700"
  if (status === "Due soon") return "bg-yellow-100 text-yellow-800"
  if (status === "No deadline") return "bg-slate-100 text-slate-600"

  return "bg-blue-100 text-blue-700"
}
