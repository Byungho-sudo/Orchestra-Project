import type { PointerEvent, ReactNode } from "react"
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
  projectedDropSurface,
  moduleError,
  modules,
  movingModuleId,
  onAddModule,
  onDeleteModule,
  onHeaderPointerDown,
  onMoveModule,
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
  projectedDropSurface: DragSurface
  moduleError: string
  modules: ProjectWorkspaceModule[]
  movingModuleId: string | null
  onAddModule: () => void
  onDeleteModule: (moduleId: string) => void
  onHeaderPointerDown: (
    event: PointerEvent<HTMLElement>,
    moduleId: string
  ) => void
  onMoveModule: (moduleId: string, direction: "up" | "down") => void
  onResetModules: () => void
  onSectionRefChange: (moduleId: string, element: HTMLElement | null) => void
  renderModuleContent: (module: ProjectWorkspaceModule) => ReactNode
}) {
  const visibleDropSlotIndex =
    projectedDropSurface === "module" ? moduleDropSlotIndex : null
  const isModuleDragging =
    activeDragSurface === "module" && Boolean(draggedModuleId)
  const renderedModules = isModuleDragging
    ? modules.filter((module) => module.id !== draggedModuleId)
    : modules
  const draggedModule =
    isModuleDragging && draggedModuleId
      ? modules.find((module) => module.id === draggedModuleId) ?? null
      : null
  const draggedModuleIndex = draggedModule
    ? modules.findIndex((module) => module.id === draggedModule.id)
    : -1

  return (
    <div className="mt-9 space-y-8">
      {moduleError && (
        <p className="text-sm font-medium text-red-600">{moduleError}</p>
      )}

      <ModuleDropPlaceholder isVisible={visibleDropSlotIndex === 0} />
      {renderedModules.map((module, moduleIndex) => (
        <div key={module.id}>
          <ProjectModuleSection
            module={module}
            isFirst={moduleIndex === 0}
            isDragging={
              activeDragSurface === "module" && draggedModuleId === module.id
            }
            isLast={moduleIndex === modules.length - 1}
            isDeleting={deletingModuleId === module.id || isResettingModules}
            isMoving={movingModuleId === module.id || isResettingModules}
            dragFrame={
              draggedModuleFrame?.moduleId === module.id ? draggedModuleFrame : null
            }
            onDelete={onDeleteModule}
            onHeaderPointerDown={onHeaderPointerDown}
            onMoveDown={(moduleId) => onMoveModule(moduleId, "down")}
            onMoveUp={(moduleId) => onMoveModule(moduleId, "up")}
            onSectionRefChange={onSectionRefChange}
          >
            {renderModuleContent(module)}
          </ProjectModuleSection>
          <ModuleDropPlaceholder
            isVisible={visibleDropSlotIndex === moduleIndex + 1}
          />
        </div>
      ))}

      {draggedModule && (
        <ProjectModuleSection
          module={draggedModule}
          isFirst={draggedModuleIndex === 0}
          isDragging
          isLast={draggedModuleIndex === modules.length - 1}
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
          onHeaderPointerDown={onHeaderPointerDown}
          onMoveDown={(moduleId) => onMoveModule(moduleId, "down")}
          onMoveUp={(moduleId) => onMoveModule(moduleId, "up")}
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
