import {
  useRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import {
  getProjectModuleDisplayTitle,
  getProjectModuleAnchor,
  projectSectionAnchorOffsetPx,
  sectionCardClassName,
} from "./helpers"
import type { ProjectWorkspaceModule } from "./types"

export function ProjectModuleSection({
  module,
  isActive,
  isDragShell,
  isDragging,
  isDeleting,
  isMoving,
  dragFrame,
  onDelete,
  onEdit,
  onHeaderPointerDown,
  onOverlayRefChange,
  onSelect,
  onSectionRefChange,
  children,
}: {
  module: ProjectWorkspaceModule
  isActive: boolean
  isDragShell?: boolean
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
  onOverlayRefChange?: (
    moduleId: string,
    element: HTMLElement | null
  ) => void
  onSelect: (module: ProjectWorkspaceModule) => void
  onSectionRefChange: (
    moduleId: string,
    element: HTMLElement | null
  ) => void
  children: ReactNode
}) {
  const sectionRef = useRef<HTMLElement | null>(null)

  function handleSectionRefChange(element: HTMLElement | null) {
    sectionRef.current = element
    onOverlayRefChange?.(module.id, element)
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

    if (isDragShell) {
      return
    }

    if (
      event.pointerType !== "mouse" &&
      !target?.closest("[data-module-drag-handle]")
    ) {
      return
    }

    onHeaderPointerDown(event, module.id)
  }

  function handleHeaderClick(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null

    if (
      target?.closest(
        "button, a, input, textarea, select, option, [data-no-select]"
      )
    ) {
      return
    }

    if (isDragging) {
      return
    }

    if (isDragShell) {
      return
    }

    onSelect(module)
  }

  return (
    <section
      ref={handleSectionRefChange}
      id={getProjectModuleAnchor(module)}
      aria-hidden={isDragShell ? true : undefined}
      className={`relative ${
        isDragging
          ? "z-20 will-change-transform"
          : "will-change-transform transition-[opacity,box-shadow,transform] duration-120"
      } ${
        isDragging
          ? "opacity-90 shadow-xl ring-1 ring-indigo-200"
          : isDragShell
            ? "overflow-hidden border-dashed border-indigo-200 bg-indigo-50/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            : ""
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
        pointerEvents: isDragShell ? "none" : undefined,
      }}
    >
      {isDragShell && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
        />
      )}

      <div className={isDragShell ? "opacity-0" : undefined}>
        <div
          onClick={handleHeaderClick}
          onPointerDown={handleHeaderPointerDown}
          className={`mb-6 flex items-start justify-between gap-4 rounded-xl border border-slate-200 px-6 py-4 transition-[border-color,background-color,box-shadow] duration-180 ${
            isDeleting || isMoving
              ? "cursor-not-allowed"
              : isDragging
                ? "cursor-grabbing border-indigo-200 bg-indigo-50/80 text-indigo-950 shadow-sm ring-1 ring-indigo-100"
                : isActive
                  ? "cursor-pointer bg-indigo-50/60 text-slate-950 shadow-sm ring-1 ring-indigo-100 lg:cursor-grab lg:active:cursor-grabbing"
                  : "cursor-pointer bg-white/80 hover:border-slate-300 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-200 lg:cursor-grab lg:active:cursor-grabbing"
          }`}
        >
          <div className="flex min-w-0 items-start gap-3">
            <div
              data-module-drag-handle
              aria-hidden="true"
              className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 lg:hidden ${
                isDeleting || isMoving
                  ? "cursor-not-allowed opacity-60"
                  : isDragging
                    ? "cursor-grabbing border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "cursor-grab touch-none hover:border-slate-400 hover:text-slate-700"
              }`}
            >
              <span className="flex flex-col gap-1">
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
              </span>
            </div>

            <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-slate-900">
              {getProjectModuleDisplayTitle(module)}
            </h2>
            </div>
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
      </div>
    </section>
  )
}
