import type { PointerEvent, ReactNode } from "react"
import { ModuleDropPlaceholder } from "./ModuleDropPlaceholder"
import { ModuleStackFooter } from "./ModuleStackFooter"
import { ProjectModuleSection } from "./ProjectModuleSection"
import type { ModuleDropPosition, ProjectWorkspaceModule } from "./types"

export function ProjectModuleList({
  deletingModuleId,
  draggedModuleFrame,
  draggedModuleId,
  isCreatingModule,
  isResettingModules,
  moduleDropTarget,
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
  moduleDropTarget: { moduleId: string; position: ModuleDropPosition } | null
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
  return (
    <div className="mt-9 space-y-8">
      {moduleError && (
        <p className="text-sm font-medium text-red-600">{moduleError}</p>
      )}

      {modules.map((module, moduleIndex) => (
        <div key={module.id}>
          <ModuleDropPlaceholder
            isVisible={
              moduleDropTarget?.moduleId === module.id &&
              moduleDropTarget.position === "before"
            }
          />
          <ProjectModuleSection
            module={module}
            isFirst={moduleIndex === 0}
            isDragging={draggedModuleId === module.id}
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
            isVisible={
              moduleDropTarget?.moduleId === module.id &&
              moduleDropTarget.position === "after"
            }
          />
        </div>
      ))}

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
