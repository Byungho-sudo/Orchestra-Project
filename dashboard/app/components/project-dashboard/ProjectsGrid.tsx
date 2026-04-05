"use client"

import { useRouter } from "next/navigation"
import { NewProjectModal } from "@/app/components/project-dashboard/NewProjectModal"
import { ProjectCard } from "@/app/components/project-dashboard/ProjectCard"
import { ProjectsGridSkeleton } from "@/app/components/project-dashboard/ProjectsGridSkeleton"
import {
  ProjectsEmptyState,
  ProjectsNoMatchesState,
} from "@/app/components/project-dashboard/ProjectsGridStates"
import { ProjectToolbar } from "@/app/components/project-dashboard/ProjectToolbar"
import { useCreateProjectForm } from "@/app/components/project-dashboard/use-create-project-form"
import { useProjectsQuery } from "@/app/components/project-dashboard/use-projects-query"
import { useCurrentUser } from "@/lib/use-current-user"

export function ProjectsGrid({
  isCreateProjectOpen,
  onOpenCreateProject,
  onCloseCreateProject,
}: {
  isCreateProjectOpen: boolean
  onOpenCreateProject: () => void
  onCloseCreateProject: () => void
}) {
  const router = useRouter()
  const { currentUser } = useCurrentUser()
  const {
    errorMessage,
    loading,
    projects,
    searchQuery,
    setErrorMessage,
    setProjects,
    setSearchQuery,
    sortedProjects,
    sortBy,
    setSortBy,
    deadlineFilter,
    setDeadlineFilter,
  } = useProjectsQuery()
  const createProjectForm = useCreateProjectForm({
    currentUser,
    onProjectCreated: (project) => {
      setProjects((current) => [...current, project])
    },
    onProjectCreateFailed: (message) => setErrorMessage(message),
    onProjectCreatedClose: onCloseCreateProject,
  })

  if (loading) {
    return <ProjectsGridSkeleton />
  }

  return (
    <main className="space-y-4">
      <ProjectToolbar
        searchQuery={searchQuery}
        deadlineFilter={deadlineFilter}
        sortBy={sortBy}
        onCreateProject={onOpenCreateProject}
        onSearchQueryChange={setSearchQuery}
        onDeadlineFilterChange={setDeadlineFilter}
        onSortByChange={setSortBy}
      />

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      {!errorMessage && projects.length === 0 && (
        <ProjectsEmptyState onCreateProject={onOpenCreateProject} />
      )}

      {!errorMessage && projects.length > 0 && sortedProjects.length === 0 && (
        <ProjectsNoMatchesState hasSearchQuery={Boolean(searchQuery.trim())} />
      )}

      {sortedProjects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpenProject={() => router.push(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}

      {isCreateProjectOpen && (
        <NewProjectModal
          name={createProjectForm.name}
          description={createProjectForm.description}
          dueDate={createProjectForm.dueDate}
          visibility={createProjectForm.visibility}
          canCreatePrivate={Boolean(currentUser)}
          errors={createProjectForm.errors}
          isSaving={createProjectForm.isSaving}
          onNameChange={(value) => {
            createProjectForm.setName(value)
            createProjectForm.clearFieldError("name")
          }}
          onDescriptionChange={(value) => {
            createProjectForm.setDescription(value)
            createProjectForm.clearFieldError("description")
          }}
          onDueDateChange={(value) => {
            createProjectForm.setDueDate(value)
            createProjectForm.clearFieldError("due_date")
          }}
          onVisibilityChange={(value) => {
            createProjectForm.setVisibility(value)
            createProjectForm.clearFieldError("visibility")
          }}
          onCancel={() => {
            createProjectForm.resetForm()
            onCloseCreateProject()
          }}
          onCreateProject={createProjectForm.createProject}
        />
      )}
    </main>
  )
}
