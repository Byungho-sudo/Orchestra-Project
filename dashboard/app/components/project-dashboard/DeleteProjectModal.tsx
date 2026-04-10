"use client"

import { ModalShell } from "@/app/components/project-dashboard/ModalShell"
import { Button } from "@/app/components/ui/Button"

export function DeleteProjectModal({
  projectName,
  isDeleting,
  onCancel,
  onConfirmDelete,
}: {
  projectName: string
  isDeleting: boolean
  onCancel: () => void
  onConfirmDelete: () => void
}) {
  return (
    <ModalShell
      isDismissDisabled={isDeleting}
      panelClassName="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      onClose={onCancel}
    >
      {({ requestClose }) => (
        <>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Delete Project
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-[var(--color-text-primary)]">
            {projectName}
          </span>{"? This action cannot be undone."}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={requestClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </div>
        </>
      )}
    </ModalShell>
  )
}
