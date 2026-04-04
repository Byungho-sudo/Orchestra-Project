import { getDeadlineStatus, type DeadlineFilter } from "@/lib/project-deadline"

export type ProjectVisibility = "public" | "private"
export type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "completed"
export type SortOption = "due_date" | "created_at" | "name" | "progress"

export type Project = {
  id: number
  name: string
  description: string | null
  progress: number
  due_date: string | null
  created_at: string
  user_id: string | null
  visibility: ProjectVisibility
  status: ProjectStatus
}

export function sortProjects(projects: Project[], sortBy: SortOption) {
  return [...projects].sort((a, b) => {
    switch (sortBy) {
      case "due_date": {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      }
      case "created_at":
        return b.created_at.localeCompare(a.created_at)
      case "name":
        return a.name.localeCompare(b.name)
      case "progress":
        return b.progress - a.progress
      default:
        return 0
    }
  })
}

export function filterProjects(
  projects: Project[],
  searchQuery: string,
  deadlineFilter: DeadlineFilter
) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return projects.filter(
    (project) =>
      project.name.toLowerCase().includes(normalizedQuery) &&
      (deadlineFilter === "All" ||
        getDeadlineStatus(project.due_date) === deadlineFilter)
  )
}
