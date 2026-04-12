"use client"

import type { ProjectFormErrors } from "@/lib/project-validation"
import { ProjectModalShell } from "@/features/projects/ProjectModalShell"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"

export function EditProjectModal({
  editName,
  editDescription,
  editDueDate,
  errors,
  isSaving,
  onEditNameChange,
  onEditDescriptionChange,
  onEditDueDateChange,
  onCancel,
  onSaveProject,
  hasUnsavedChanges = false,
}: {
  editName: string
  editDescription: string
  editDueDate: string
  errors: ProjectFormErrors
  isSaving: boolean
  onEditNameChange: (value: string) => void
  onEditDescriptionChange: (value: string) => void
  onEditDueDateChange: (value: string) => void
  onCancel: () => void
  onSaveProject: () => void
  hasUnsavedChanges?: boolean
}) {
  return (
    <ProjectModalShell
      hasUnsavedChanges={hasUnsavedChanges}
      isDismissDisabled={isSaving}
      panelClassName="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      onClose={onCancel}
    >
      {({ requestClose }) => (
        <>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Edit Project
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Update this project&apos;s information.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <Input
              value={editName}
              onChange={(event) => onEditNameChange(event.target.value)}
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
              value={editDescription}
              onChange={(event) => onEditDescriptionChange(event.target.value)}
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
              value={editDueDate}
              onChange={(event) => onEditDueDateChange(event.target.value)}
            />
            {errors.due_date && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.due_date}
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
            onClick={onSaveProject}
            disabled={isSaving || !editName.trim()}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
        </>
      )}
    </ProjectModalShell>
  )
}
