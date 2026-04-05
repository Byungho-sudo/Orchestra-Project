import { useRef, type PointerEvent, type ReactNode } from "react"
import {
  getProjectModuleAnchor,
  projectSectionAnchorOffsetPx,
  sectionCardClassName,
} from "./helpers"
import type { ProjectWorkspaceModule } from "./types"

export function ProjectModuleSection({
  module,
  isFirst,
  isDragging,
  isLast,
  isDeleting,
  isMoving,
  dragFrame,
  onDelete,
  onHeaderPointerDown,
  onMoveDown,
  onMoveUp,
  onSectionRefChange,
  children,
}: {
  module: ProjectWorkspaceModule
  isFirst: boolean
  isDragging: boolean
  isLast: boolean
  isDeleting: boolean
  isMoving: boolean
  dragFrame:
    | {
        moduleId: string
        left: number
        top: number
        width: number
        height: number
      }
    | null
  onDelete: (moduleId: string) => void
  onHeaderPointerDown: (
    event: PointerEvent<HTMLElement>,
    moduleId: string
  ) => void
  onMoveDown: (moduleId: string) => void
  onMoveUp: (moduleId: string) => void
  onSectionRefChange: (
    moduleId: string,
    element: HTMLElement | null
  ) => void
  children: ReactNode
}) {
  const sectionRef = useRef<HTMLElement | null>(null)

  function handleSectionRefChange(element: HTMLElement | null) {
    sectionRef.current = element
    onSectionRefChange(module.id, element)
  }

  function handleHeaderPointerDown(event: PointerEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null

    if (
      target?.closest(
        "button, a, input, textarea, select, option, [data-no-drag]"
      )
    ) {
      return
    }

    onHeaderPointerDown(event, module.id)
  }

  return (
    <section
      ref={handleSectionRefChange}
      id={getProjectModuleAnchor(module)}
      className={`relative ${
        isDragging
          ? "z-20 will-change-[top,left] transition-[opacity,box-shadow] duration-150"
          : "will-change-transform transition-[opacity,box-shadow,transform] duration-150"
      } ${
        isDragging ? "opacity-90 shadow-xl ring-1 ring-indigo-200" : ""
      } ${sectionCardClassName}`}
      style={{
        scrollMarginTop: `${projectSectionAnchorOffsetPx}px`,
        cursor: isDragging ? "grabbing" : undefined,
        position: isDragging && dragFrame ? "fixed" : undefined,
        left: isDragging && dragFrame ? `${dragFrame.left}px` : undefined,
        top: isDragging && dragFrame ? `${dragFrame.top}px` : undefined,
        width: isDragging && dragFrame ? `${dragFrame.width}px` : undefined,
      }}
    >
      <div
        onPointerDown={handleHeaderPointerDown}
        className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg transition-colors ${
          isDeleting || isMoving
            ? "cursor-not-allowed"
            : isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
        }`}
      >
        <div className="flex flex-wrap justify-end gap-3">
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
