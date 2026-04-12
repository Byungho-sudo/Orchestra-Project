"use client"

import type { ProjectFormErrors } from "@/lib/project-validation"
import type { ProjectVisibility } from "@/lib/projects"
import { ProjectModalShell } from "@/features/projects/ProjectModalShell"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"

export function NewProjectModal({
  name,
  description,
  dueDate,
  visibility,
  canCreatePrivate,
  errors,
  isSaving,
  onNameChange,
  onDescriptionChange,
  onDueDateChange,
  onVisibilityChange,
  onCancel,
  onCreateProject,
}: {
  name: string
  description: string
  dueDate: string
  visibility: ProjectVisibility
  canCreatePrivate: boolean
  errors: ProjectFormErrors
  isSaving: boolean
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onDueDateChange: (value: string) => void
  onVisibilityChange: (value: ProjectVisibility) => void
  onCancel: () => void
  onCreateProject: () => void
}) {
  return (
    <ProjectModalShell
      hasUnsavedChanges={Boolean(
        name.trim() || description.trim() || dueDate || visibility !== "public"
      )}
      isDismissDisabled={isSaving}
      panelClassName="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      onClose={onCancel}
    >
      {({ requestClose }) => (
        <>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          New Project
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Add a new project card to the dashboard.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <Input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Project name"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <Textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Project description"
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => onDueDateChange(event.target.value)}
            />
            {errors.due_date && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.due_date}
              </p>
            )}
          </div>

          <div>
            <Select
              value={visibility}
              onChange={(event) =>
                onVisibilityChange(event.target.value as ProjectVisibility)
              }
            >
              <option value="public">Public</option>
              {canCreatePrivate ? <option value="private">Private</option> : null}
            </Select>
            {errors.visibility && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.visibility}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={requestClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={onCreateProject}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Creating..." : "Create Project"}
          </Button>
        </div>
        </>
      )}
    </ProjectModalShell>
  )
}
