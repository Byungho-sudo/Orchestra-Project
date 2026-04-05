import Link from "next/link"
import type { MouseEvent, PointerEvent, RefObject } from "react"
import type { DragSurface } from "./hooks/useModuleDnD"
import { NavDropPlaceholder } from "./NavDropPlaceholder"

type NavigationItem = {
  id: string
  label: string
  moduleId: string | null
}

export function ProjectSidebarNav({
  activeSection,
  activeDragSurface,
  draggedModuleId,
  draggedNavItemFrame,
  fixedItem,
  isAddDisabled,
  navDropSlotIndex,
  projectedDropSurface,
  navListRef,
  onAddModule,
  onFixedItemClick,
  onModuleItemClick,
  onModuleItemPointerDown,
  onModuleItemRefChange,
  sortableItems,
}: {
  activeSection: string
  activeDragSurface: DragSurface
  draggedModuleId: string | null
  draggedNavItemFrame: {
    moduleId: string
    left: number
    top: number
    width: number
    height: number
  } | null
  fixedItem: NavigationItem
  isAddDisabled: boolean
  navDropSlotIndex: number | null
  projectedDropSurface: DragSurface
  navListRef: RefObject<HTMLDivElement | null>
  onAddModule: () => void
  onFixedItemClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onModuleItemClick: (
    event: MouseEvent<HTMLAnchorElement>,
    itemId: string,
    href: string
  ) => void
  onModuleItemPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    moduleId: string,
    itemId: string
  ) => void
  onModuleItemRefChange: (
    moduleId: string,
    element: HTMLDivElement | null
  ) => void
  sortableItems: NavigationItem[]
}) {
  const visibleDropSlotIndex =
    projectedDropSurface === "nav" ? navDropSlotIndex : null
  const isNavDragging = activeDragSurface === "nav" && Boolean(draggedModuleId)
  const renderedSortableItems = isNavDragging
    ? sortableItems.filter((item) => item.moduleId !== draggedModuleId)
    : sortableItems
  const draggedSortableItem =
    isNavDragging && draggedModuleId
      ? sortableItems.find((item) => item.moduleId === draggedModuleId) ?? null
      : null

  return (
    <aside className="rounded-xl border border-slate-300 bg-slate-50 p-5 shadow-sm lg:sticky lg:top-6">
      <h2 className="mb-4 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Navigation
      </h2>

      <nav className="text-sm">
        <div className="space-y-2">
          <Link
            href={`#${fixedItem.id}`}
            aria-current={activeSection === fixedItem.id ? "location" : undefined}
            onClick={onFixedItemClick}
            className={`block rounded-xl border px-3 py-3 text-sm transition-[border-color,background-color,box-shadow,color] duration-150 ${
              activeSection === fixedItem.id
                ? "border-indigo-200 bg-indigo-50/90 font-medium text-indigo-900 shadow-sm"
                : "border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-sm"
            }`}
          >
            {fixedItem.label}
          </Link>
        </div>

        <div ref={navListRef} className="mt-2">
          <NavDropPlaceholder isVisible={visibleDropSlotIndex === 0} />
          {renderedSortableItems.map((item, itemIndex) => {
            return (
              <div key={item.id}>
                <div
                  ref={(element) =>
                    item.moduleId
                      ? onModuleItemRefChange(item.moduleId, element)
                      : undefined
                  }
                  onPointerDown={(event) =>
                    item.moduleId
                      ? onModuleItemPointerDown(event, item.moduleId, item.id)
                      : undefined
                  }
                  className={`relative transition-transform duration-150 ${
                    item.moduleId ? "cursor-grab active:cursor-grabbing" : ""
                  } ${
                    activeDragSurface === "nav" && draggedModuleId === item.moduleId
                      ? "scale-[0.985]"
                      : ""
                  }`}
                  style={
                    activeDragSurface === "nav" &&
                    draggedNavItemFrame?.moduleId === item.moduleId
                      ? {
                          position: "fixed",
                          left: `${draggedNavItemFrame.left}px`,
                          top: `${draggedNavItemFrame.top}px`,
                          width: `${draggedNavItemFrame.width}px`,
                          zIndex: 20,
                        }
                      : undefined
                  }
                >
                  <Link
                    href={`#${item.id}`}
                    draggable={false}
                    aria-current={activeSection === item.id ? "location" : undefined}
                    onDragStart={(event) => event.preventDefault()}
                    onClick={(event) =>
                      onModuleItemClick(event, item.id, `#${item.id}`)
                    }
                    className={`block rounded-xl border px-3 py-3 text-sm transition-[border-color,background-color,box-shadow,color,transform,opacity] duration-150 ${
                      activeSection === item.id
                        ? "border-indigo-200 bg-indigo-50/90 font-medium text-indigo-900 shadow-sm"
                        : "border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                    } ${
                      activeDragSurface === "nav" &&
                      draggedModuleId === item.moduleId
                        ? "border-indigo-200 bg-white shadow-md ring-1 ring-indigo-100 opacity-80"
                        : ""
                    } ${itemIndex > 0 ? "mt-2" : ""}`}
                  >
                    {item.label}
                  </Link>
                </div>
                <NavDropPlaceholder
                  isVisible={visibleDropSlotIndex === itemIndex + 1}
                />
              </div>
            )
          })}

          {draggedSortableItem && draggedNavItemFrame && (
            <div
              ref={(element) =>
                draggedSortableItem.moduleId
                  ? onModuleItemRefChange(draggedSortableItem.moduleId, element)
                  : undefined
              }
              className="relative scale-[0.985] cursor-grabbing transition-transform duration-150"
              style={{
                position: "fixed",
                left: `${draggedNavItemFrame.left}px`,
                top: `${draggedNavItemFrame.top}px`,
                width: `${draggedNavItemFrame.width}px`,
                zIndex: 20,
              }}
            >
              <div className="block rounded-xl border border-indigo-200 bg-white px-3 py-3 text-sm text-slate-700 shadow-md ring-1 ring-indigo-100 opacity-80">
                {draggedSortableItem.label}
              </div>
            </div>
          )}
        </div>

        <div className="mt-2">
          <button
            type="button"
            onClick={onAddModule}
            disabled={isAddDisabled}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 text-lg font-medium text-slate-600 transition-[border-color,background-color,box-shadow,color] duration-150 hover:border-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Add Module"
          >
            +
          </button>
        </div>
      </nav>
    </aside>
  )
}
