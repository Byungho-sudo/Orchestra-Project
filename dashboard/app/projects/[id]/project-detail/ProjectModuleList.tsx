import {
  useLayoutEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
} from "react"
import {
  projectModuleStackGapClassName,
  reorderWorkspaceModulesBySlot,
} from "./helpers"
import { ModuleDropPlaceholder } from "./ModuleDropPlaceholder"
import { ModuleStackFooter } from "./ModuleStackFooter"
import { ProjectModuleSection } from "./ProjectModuleSection"
import type { DragSurface } from "./hooks/useModuleDnD"
import type { ProjectWorkspaceModule } from "./types"

export function ProjectModuleList({
  activeDragSurface,
  deletingModuleId,
  draggedModuleFrame,
  draggedModuleId,
  isCreatingModule,
  isResettingModules,
  moduleDropSlotIndex,
  navDropSlotIndex,
  projectedDropSurface,
  moduleError,
  modules,
  movingModuleId,
  onAddModule,
  onDeleteModule,
  onEditModule,
  onHeaderPointerDown,
  onResetModules,
  onSectionRefChange,
  renderModuleContent,
}: {
  activeDragSurface: DragSurface
  deletingModuleId: string | null
  draggedModuleFrame: {
    moduleId: string
    left: number
    top: number
    width: number
    height: number
  } | null
  draggedModuleId: string | null
  isCreatingModule: boolean
  isResettingModules: boolean
  moduleDropSlotIndex: number | null
  navDropSlotIndex: number | null
  projectedDropSurface: DragSurface
  moduleError: string
  modules: ProjectWorkspaceModule[]
  movingModuleId: string | null
  onAddModule: () => void
  onDeleteModule: (moduleId: string) => void
  onEditModule: (module: ProjectWorkspaceModule) => void
  onHeaderPointerDown: (
    event: PointerEvent<HTMLElement>,
    moduleId: string
  ) => void
  onResetModules: () => void
  onSectionRefChange: (moduleId: string, element: HTMLElement | null) => void
  renderModuleContent: (module: ProjectWorkspaceModule) => ReactNode
}) {
  const moduleItemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const previousModuleTopsRef = useRef<Record<string, number>>({})
  const previousModuleOrderSignatureRef = useRef<string | null>(null)
  const visibleDropSlotIndex =
    projectedDropSurface === "module" ? moduleDropSlotIndex : null
  const isModuleDragging =
    activeDragSurface === "module" && Boolean(draggedModuleId)
  const isNavDragging = activeDragSurface === "nav" && Boolean(draggedModuleId)
  const renderedModules = isModuleDragging
    ? modules.filter((module) => module.id !== draggedModuleId)
    : isNavDragging && draggedModuleId
      ? reorderWorkspaceModulesBySlot(modules, draggedModuleId, navDropSlotIndex)
    : modules
  const moduleOrderSignature = renderedModules.map((module) => module.id).join(":")
  const draggedModule =
    isModuleDragging && draggedModuleId
      ? modules.find((module) => module.id === draggedModuleId) ?? null
      : null
  const placeholderHeight =
    draggedModuleFrame?.height ??
    (draggedModuleId
      ? moduleItemRefs.current[draggedModuleId]?.getBoundingClientRect().height ?? null
      : null)

  useLayoutEffect(() => {
    const nextModuleTops: Record<string, number> = {}
    const previousModuleOrderSignature = previousModuleOrderSignatureRef.current
    const shouldAnimate =
      !isModuleDragging &&
      previousModuleOrderSignature !== null &&
      previousModuleOrderSignature !== moduleOrderSignature

    for (const workspaceModule of renderedModules) {
      const element = moduleItemRefs.current[workspaceModule.id]

      if (!element) continue

      const nextTop = element.getBoundingClientRect().top
      nextModuleTops[workspaceModule.id] = nextTop

      if (!shouldAnimate) {
        element.style.transform = ""
        element.style.transition = ""
        continue
      }

      const previousTop = previousModuleTopsRef.current[workspaceModule.id]
      const deltaY = previousTop === undefined ? 0 : previousTop - nextTop

      if (Math.abs(deltaY) < 1) {
        element.style.transform = ""
        element.style.transition = ""
        continue
      }

      element.style.transition = "none"
      element.style.transform = `translate3d(0, ${deltaY}px, 0)`
      element.getBoundingClientRect()
      element.style.transition =
        "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)"
      element.style.transform = "translate3d(0, 0, 0)"
    }

    previousModuleTopsRef.current = nextModuleTops
    previousModuleOrderSignatureRef.current = moduleOrderSignature
  }, [isModuleDragging, moduleOrderSignature, renderedModules])

  return (
    <div className={`mt-9 ${projectModuleStackGapClassName}`}>
      {moduleError && (
        <p className="text-sm font-medium text-red-600">{moduleError}</p>
      )}

      <ModuleDropPlaceholder
        height={placeholderHeight}
        isVisible={visibleDropSlotIndex === 0}
      />
      {renderedModules.map((module, moduleIndex) => (
        <div
          key={module.id}
          ref={(element) => {
            moduleItemRefs.current[module.id] = element
          }}
        >
          <ProjectModuleSection
            module={module}
            isDragging={
              activeDragSurface === "module" && draggedModuleId === module.id
            }
            isDeleting={deletingModuleId === module.id || isResettingModules}
            isMoving={movingModuleId === module.id || isResettingModules}
            dragFrame={
              draggedModuleFrame?.moduleId === module.id ? draggedModuleFrame : null
            }
            onDelete={onDeleteModule}
            onEdit={onEditModule}
            onHeaderPointerDown={onHeaderPointerDown}
            onSectionRefChange={onSectionRefChange}
          >
            {renderModuleContent(module)}
          </ProjectModuleSection>
          <ModuleDropPlaceholder
            height={placeholderHeight}
            isVisible={visibleDropSlotIndex === moduleIndex + 1}
          />
        </div>
      ))}

      {draggedModule && (
        <ProjectModuleSection
          module={draggedModule}
          isDragging
          isDeleting={
            deletingModuleId === draggedModule.id || isResettingModules
          }
          isMoving={movingModuleId === draggedModule.id || isResettingModules}
          dragFrame={
            draggedModuleFrame?.moduleId === draggedModule.id
              ? draggedModuleFrame
              : null
          }
          onDelete={onDeleteModule}
          onEdit={onEditModule}
          onHeaderPointerDown={onHeaderPointerDown}
          onSectionRefChange={onSectionRefChange}
        >
          {renderModuleContent(draggedModule)}
        </ProjectModuleSection>
      )}

      <ModuleStackFooter
        isBusy={
          isResettingModules ||
          isCreatingModule ||
          Boolean(deletingModuleId) ||
          Boolean(movingModuleId)
        }
        isCreatingModule={isCreatingModule}
        isResettingModules={isResettingModules}
        onAddModule={onAddModule}
        onResetModules={onResetModules}
      />
    </div>
  )
}
