"use client"

import type { DeadlineFilter } from "@/lib/project-deadline"
import type { SortOption } from "@/lib/projects"
import { Button } from "@/app/components/ui/Button"
import { Input } from "@/app/components/ui/Input"
import { Select } from "@/app/components/ui/Select"

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
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
        Project Cards
      </h2>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center text-sm">
        <Input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search projects..."
          className="sm:w-56"
        />

        <div className="flex items-center gap-2">
          <Select
            value={deadlineFilter}
            onChange={(event) =>
              onDeadlineFilterChange(event.target.value as DeadlineFilter)
            }
            className="w-auto"
          >
            <option value="All">All</option>
            <option value="Overdue">Overdue</option>
            <option value="Due today">Due today</option>
            <option value="Due soon">Due soon</option>
            <option value="No deadline">No deadline</option>
          </Select>

          <span className="text-[var(--color-text-secondary)]">Sort by:</span>
          <Select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortOption)}
            className="w-auto"
          >
            <option value="due_date">Due date</option>
            <option value="created_at">Created date</option>
            <option value="name">Name</option>
            <option value="progress">Progress</option>
          </Select>

          <Button onClick={onCreateProject}>
            New Project
          </Button>
        </div>
      </div>
    </div>
  )
}
