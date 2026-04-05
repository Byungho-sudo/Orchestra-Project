"use client"

import type { DeadlineFilter } from "@/lib/project-deadline"
import type { SortOption } from "@/lib/projects"

export function ProjectToolbar({
  searchQuery,
  deadlineFilter,
  sortBy,
  onCreateProject,
  onSearchQueryChange,
  onDeadlineFilterChange,
  onSortByChange,
}: {
  searchQuery: string
  deadlineFilter: DeadlineFilter
  sortBy: SortOption
  onCreateProject: () => void
  onSearchQueryChange: (value: string) => void
  onDeadlineFilterChange: (value: DeadlineFilter) => void
  onSortByChange: (value: SortOption) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl font-semibold">Project Cards</h2>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center text-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search projects..."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 sm:w-56"
        />

        <div className="flex items-center gap-2">
          <select
            value={deadlineFilter}
            onChange={(event) =>
              onDeadlineFilterChange(event.target.value as DeadlineFilter)
            }
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All</option>
            <option value="Overdue">Overdue</option>
            <option value="Due today">Due today</option>
            <option value="Due soon">Due soon</option>
            <option value="No deadline">No deadline</option>
          </select>

          <span className="text-slate-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortOption)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="due_date">Due date</option>
            <option value="created_at">Created date</option>
            <option value="name">Name</option>
            <option value="progress">Progress</option>
          </select>

          <button
            type="button"
            onClick={onCreateProject}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            New Project
          </button>
        </div>
      </div>
    </div>
  )
}
