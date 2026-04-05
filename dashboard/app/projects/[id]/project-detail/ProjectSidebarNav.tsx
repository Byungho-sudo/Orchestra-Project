import Link from "next/link"
import type { MouseEvent, PointerEvent, RefObject } from "react"
import type { DragSurface } from "./hooks/useModuleDnD"
import { NavDropPlaceholder } from "./NavDropPlaceholder"

type NavigationItem = {
  id: string
  label: string
  moduleId: string | null
}

function reorderNavigationItemsBySlot(
  items: NavigationItem[],
  draggedModuleId: string,
  slotIndex: number | null
) {
  if (slotIndex === null) return items

  const draggedIndex = items.findIndex((item) => item.moduleId === draggedModuleId)

  if (draggedIndex === -1) return items

  const reorderedItems = [...items]
  const [draggedItem] = reorderedItems.splice(draggedIndex, 1)
  const normalizedSlotIndex = Math.max(
    0,
    Math.min(slotIndex, reorderedItems.length)
  )

  reorderedItems.splice(normalizedSlotIndex, 0, draggedItem)

  return reorderedItems
}

export function ProjectSidebarNav({
  activeSection,
  activeDragSurface,
  draggedModuleId,
  draggedNavItemFrame,
  fixedItem,
  isAddDisabled,
  moduleDropSlotIndex,
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
  moduleDropSlotIndex: number | null
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
  const isModuleDragging = activeDragSurface === "module" && Boolean(draggedModuleId)
  const dragHighlightedSectionId =
    draggedModuleId && activeDragSurface
      ? sortableItems.find((item) => item.moduleId === draggedModuleId)?.id ?? null
      : null
  const highlightedSectionId = dragHighlightedSectionId ?? activeSection
  const renderedSortableItems = isNavDragging
    ? sortableItems.filter((item) => item.moduleId !== draggedModuleId)
    : isModuleDragging && draggedModuleId
      ? reorderNavigationItemsBySlot(
          sortableItems,
          draggedModuleId,
          moduleDropSlotIndex
        )
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
            aria-current={
              highlightedSectionId === fixedItem.id ? "location" : undefined
            }
            onClick={onFixedItemClick}
            className={`block rounded-xl border px-3 py-3 text-sm transition-[border-color,background-color,box-shadow,color] duration-150 ${
              highlightedSectionId === fixedItem.id
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
                      : activeDragSurface === "module" &&
                          draggedModuleId === item.moduleId
                        ? "scale-[0.98]"
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
                    aria-current={
                      highlightedSectionId === item.id ? "location" : undefined
                    }
                    onDragStart={(event) => event.preventDefault()}
                    onClick={(event) =>
                      onModuleItemClick(event, item.id, `#${item.id}`)
                    }
                    className={`block rounded-xl border px-3 py-3 text-sm transition-[border-color,background-color,box-shadow,color,transform,opacity] duration-150 ${
                      highlightedSectionId === item.id
                        ? "border-indigo-200 bg-indigo-50/90 font-medium text-indigo-900 shadow-sm"
                        : "border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                    } ${
                      activeDragSurface === "nav" &&
                      draggedModuleId === item.moduleId
                        ? "border-indigo-200 bg-indigo-50/95 font-medium text-indigo-900 shadow-md ring-1 ring-indigo-100 opacity-90"
                        : activeDragSurface === "module" &&
                            draggedModuleId === item.moduleId
                          ? "border-indigo-200 bg-indigo-50/95 font-medium text-indigo-900 shadow-sm ring-1 ring-indigo-100"
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
              <div className="block rounded-xl border border-indigo-200 bg-indigo-50/95 px-3 py-3 text-sm font-medium text-indigo-900 shadow-md ring-1 ring-indigo-100 opacity-90">
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
