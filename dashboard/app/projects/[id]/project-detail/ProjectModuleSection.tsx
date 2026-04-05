import type { ReactNode } from "react"
import { getProjectModuleAnchor, sectionCardClassName } from "./helpers"
import type { ProjectWorkspaceModule } from "./types"

export function ProjectModuleSection({
  module,
  isFirst,
  isLast,
  isDeleting,
  isMoving,
  onDelete,
  onMoveDown,
  onMoveUp,
  children,
}: {
  module: ProjectWorkspaceModule
  isFirst: boolean
  isLast: boolean
  isDeleting: boolean
  isMoving: boolean
  onDelete: (moduleId: string) => void
  onMoveDown: (moduleId: string) => void
  onMoveUp: (moduleId: string) => void
  children: ReactNode
}) {
  return (
    <section
      id={getProjectModuleAnchor(module)}
      className={`${sectionCardClassName} scroll-mt-8 lg:scroll-mt-10`}
    >
      <div className="mb-4 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => onMoveUp(module.id)}
          disabled={isFirst || isMoving || isDeleting}
          className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Move Up
        </button>

        <button
          type="button"
          onClick={() => onMoveDown(module.id)}
          disabled={isLast || isMoving || isDeleting}
          className="text-sm font-medium text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Move Down
        </button>
      </div>

      {children}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => onDelete(module.id)}
          disabled={isDeleting}
          className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete Module"}
        </button>
      </div>
    </section>
  )
}
