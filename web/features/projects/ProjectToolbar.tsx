"use client"

import type { DeadlineFilter } from "@/lib/project-deadline"
import type { SortOption } from "@/lib/projects"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { ProjectsToolbarFrame } from "@/features/projects/ProjectsToolbarFrame"

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
    <ProjectsToolbarFrame
      title={
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-[var(--theme-shell-foreground)]">
          Project Cards
        </h2>
      }
      primaryControl={
        <Input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search projects..."
          className="border-[var(--theme-shell-border)] bg-[var(--theme-input)] text-[var(--theme-shell-foreground)] shadow-none placeholder:text-[var(--theme-nav-muted)] sm:w-56"
        />
      }
      secondaryControls={
        <>
          <Select
            value={deadlineFilter}
            onChange={(event) =>
              onDeadlineFilterChange(event.target.value as DeadlineFilter)
            }
            className="w-auto border-[var(--theme-shell-border)] bg-[var(--theme-input)] text-[var(--theme-shell-foreground)] shadow-none"
          >
            <option value="All">All</option>
            <option value="Overdue">Overdue</option>
            <option value="Due today">Due today</option>
            <option value="Due soon">Due soon</option>
            <option value="No deadline">No deadline</option>
          </Select>

          <span className="text-[var(--theme-nav-muted)]">Sort by:</span>
          <Select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortOption)}
            className="w-auto border-[var(--theme-shell-border)] bg-[var(--theme-input)] text-[var(--theme-shell-foreground)] shadow-none"
          >
            <option value="due_date">Due date</option>
            <option value="created_at">Created date</option>
            <option value="name">Name</option>
            <option value="progress">Progress</option>
          </Select>

          <Button
            onClick={onCreateProject}
            className="border-transparent bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] shadow-[0_10px_22px_-16px_var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] focus-visible:ring-[var(--theme-focus-ring)] sm:ml-2"
          >
            New Project
          </Button>
        </>
      }
    />
  )
}
