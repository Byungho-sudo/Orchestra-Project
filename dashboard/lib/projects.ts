import { getDeadlineStatus, type DeadlineFilter } from "@/lib/project-deadline"

export type ProjectVisibility = "public" | "private"
export type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "completed"
export type ProjectTaskPriority = "low" | "medium" | "high"
export type ProjectTaskStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
export type SortOption = "due_date" | "created_at" | "name" | "progress"

export type ProjectTask = {
  id: number
  project_id: number
  module_id: string | null
  text: string
  completed: boolean
  completed_at: string | null
  due_date: string | null
  priority: ProjectTaskPriority
  status: ProjectTaskStatus
  created_at: string
}

export type ProjectMetadata = {
  id: string
  project_id: number
  key: string
  value: string
  order: number
  created_at: string
}

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
  intention: string | null
  idea: string | null
  target_buyer: string | null
  product: string | null
  price: string | null
  tools: string | null
  supplier: string | null
  budget: string | null
  notes: string | null
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
