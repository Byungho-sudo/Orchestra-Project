import { useRef, type PointerEvent, type ReactNode } from "react"
import {
  getProjectModuleDisplayTitle,
  getProjectModuleAnchor,
  projectSectionAnchorOffsetPx,
  sectionCardClassName,
} from "./helpers"
import type { ProjectWorkspaceModule } from "./types"

export function ProjectModuleSection({
  module,
  isDragging,
  isDeleting,
  isMoving,
  dragFrame,
  onDelete,
  onEdit,
  onHeaderPointerDown,
  onSectionRefChange,
  children,
}: {
  module: ProjectWorkspaceModule
  isDragging: boolean
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
  onEdit: (module: ProjectWorkspaceModule) => void
  onHeaderPointerDown: (
    event: PointerEvent<HTMLElement>,
    moduleId: string
  ) => void
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
          ? "z-20 will-change-transform"
          : "will-change-transform transition-[opacity,box-shadow,transform] duration-120"
      } ${
        isDragging ? "opacity-90 shadow-xl ring-1 ring-indigo-200" : ""
      } ${sectionCardClassName}`}
      style={{
        scrollMarginTop: `${projectSectionAnchorOffsetPx}px`,
        cursor: isDragging ? "grabbing" : undefined,
        position: isDragging && dragFrame ? "fixed" : undefined,
        left: isDragging && dragFrame ? `${dragFrame.left}px` : undefined,
        top: isDragging && dragFrame ? `${dragFrame.top}px` : undefined,
        height: isDragging && dragFrame ? `${dragFrame.height}px` : undefined,
        width: isDragging && dragFrame ? `${dragFrame.width}px` : undefined,
        transform: isDragging && dragFrame ? "translate3d(0, 0, 0)" : undefined,
        transition: isDragging ? "none" : undefined,
      }}
    >
      <div
        onPointerDown={handleHeaderPointerDown}
        className={`mb-6 flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white/80 px-6 py-4 transition-[border-color,background-color,box-shadow,color] duration-120 ${
          isDeleting || isMoving
            ? "cursor-not-allowed"
            : isDragging
              ? "cursor-grabbing border-indigo-200 bg-indigo-50/80 text-indigo-950 shadow-sm"
              : "cursor-grab hover:border-slate-300 hover:bg-white hover:shadow-sm"
        }`}
      >
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-slate-900">
            {getProjectModuleDisplayTitle(module)}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onEdit(module)}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Edit
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
