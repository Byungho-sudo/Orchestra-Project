import type { ProjectHealth, ProjectStatus } from "@/lib/projects"

export type TimelineProgressStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "blocked"

export type TimelineProgressEvent = {
  start_date: string
  end_date: string | null
  status: TimelineProgressStatus
}

function getDateValue(date: string | null) {
  if (!date) return null

  const [year, month, day] = date.split("-").map(Number)

  if (!year || !month || !day) {
    return null
  }

  return Date.UTC(year, month - 1, day)
}

export function calculateProjectProgressFromTimeline(
  events: TimelineProgressEvent[]
): {
  health: ProjectHealth
  progress_percent: number
  status: ProjectStatus
} {
  if (events.length === 0) {
    return {
      health: "on_track",
      progress_percent: 0,
      status: "not_started",
    }
  }

  const today = new Date()
  const todayValue = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const completedCount = events.filter((event) => event.status === "completed").length
  const blockedCount = events.filter((event) => event.status === "blocked").length
  const inProgressCount = events.filter(
    (event) => event.status === "in_progress"
  ).length
  const hasOverdueIncompleteEvent = events.some((event) => {
    if (event.status === "completed") {
      return false
    }

    const comparisonDate =
      getDateValue(event.end_date) ?? getDateValue(event.start_date)

    return comparisonDate !== null && comparisonDate < todayValue
  })

  let status: ProjectStatus = "not_started"

  if (completedCount === events.length) {
    status = "completed"
  } else if (inProgressCount > 0 || completedCount > 0) {
    status = "in_progress"
  } else if (blockedCount > 0) {
    status = "paused"
  }

  let health: ProjectHealth = "on_track"

  if (blockedCount > 0) {
    health = "off_track"
  } else if (hasOverdueIncompleteEvent) {
    health = "at_risk"
  }

  return {
    health,
    progress_percent: Math.round((completedCount / events.length) * 100),
    status,
  }
}
