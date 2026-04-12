import Link from "next/link"
import {
  useLayoutEffect,
  useMemo,
  useRef,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react"
import {
  Sidebar,
  SidebarItem,
  getSidebarItemClassName,
} from "@/components/layout/Sidebar"
import type { DragSurface } from "./hooks/useModuleDnD"

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
  navListRef,
  settlingModuleDrop,
  onAddModule,
  onDraggedNavItemOverlayRefChange,
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
  navListRef: RefObject<HTMLDivElement | null>
  settlingModuleDrop: {
    moduleId: string
    slotIndex: number
  } | null
  onAddModule: () => void
  onDraggedNavItemOverlayRefChange: (
    moduleId: string,
    element: HTMLDivElement | null
  ) => void
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
  const navItemElementRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const previousNavItemTopsRef = useRef<Record<string, number>>({})
  const previousRenderedNavOrderSignatureRef = useRef<string | null>(null)
  const isNavDragging = activeDragSurface === "nav" && Boolean(draggedModuleId)
  const isModuleDragging = activeDragSurface === "module" && Boolean(draggedModuleId)
  const dragHighlightedSectionId =
    draggedModuleId && activeDragSurface
      ? sortableItems.find((item) => item.moduleId === draggedModuleId)?.id ?? null
      : null
  const highlightedSectionId = dragHighlightedSectionId ?? activeSection
  const renderedSortableItems = useMemo(
    () =>
      isNavDragging
        ? reorderNavigationItemsBySlot(
            sortableItems,
            draggedModuleId!,
            navDropSlotIndex
          )
        : settlingModuleDrop
          ? reorderNavigationItemsBySlot(
              sortableItems,
              settlingModuleDrop.moduleId,
              settlingModuleDrop.slotIndex
            )
        : isModuleDragging && draggedModuleId
          ? reorderNavigationItemsBySlot(
              sortableItems,
              draggedModuleId,
              moduleDropSlotIndex
            )
          : sortableItems,
    [
      draggedModuleId,
      isModuleDragging,
      isNavDragging,
      moduleDropSlotIndex,
      navDropSlotIndex,
      settlingModuleDrop,
      sortableItems,
    ]
  )
  const renderedNavOrderSignature = renderedSortableItems
    .map((item) => item.id)
    .join(":")
  const draggedSortableItem =
    isNavDragging && draggedModuleId
      ? sortableItems.find((item) => item.moduleId === draggedModuleId) ?? null
      : null

  useLayoutEffect(() => {
    const nextNavItemTops: Record<string, number> = {}
    const previousRenderedNavOrderSignature =
      previousRenderedNavOrderSignatureRef.current
    const shouldAnimate =
      previousRenderedNavOrderSignature !== null &&
      previousRenderedNavOrderSignature !== renderedNavOrderSignature

    for (const item of renderedSortableItems) {
      if (!item.moduleId) continue

      const element = navItemElementRefs.current[item.moduleId]

      if (!element) continue

      const nextTop = element.getBoundingClientRect().top
      nextNavItemTops[item.moduleId] = nextTop

      if (!shouldAnimate) {
        element.style.transform = ""
        element.style.transition = ""
        continue
      }

      const previousTop = previousNavItemTopsRef.current[item.moduleId]
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
        "transform 140ms cubic-bezier(0.22, 1, 0.36, 1)"
      element.style.transform = "translate3d(0, 0, 0)"
    }

    previousNavItemTopsRef.current = nextNavItemTops
    previousRenderedNavOrderSignatureRef.current = renderedNavOrderSignature
  }, [renderedNavOrderSignature, renderedSortableItems])

  return (
    <Sidebar title="Navigation">
      <nav className="text-sm">
        <div className="space-y-2">
          <SidebarItem
            href={`#${fixedItem.id}`}
            ariaCurrent={
              highlightedSectionId === fixedItem.id ? "location" : undefined
            }
            onClick={onFixedItemClick}
            isActive={highlightedSectionId === fixedItem.id}
          >
            {fixedItem.label}
          </SidebarItem>
        </div>

        <div ref={navListRef} className="mt-2">
          {renderedSortableItems.map((item, itemIndex) => {
            const isItemActive = highlightedSectionId === item.id
            const isDragShell =
              isNavDragging && draggedModuleId === item.moduleId
            return (
              <div key={item.id}>
                <div
                  ref={(element) =>
                    item.moduleId
                      ? (() => {
                          navItemElementRefs.current[item.moduleId] = element
                          onModuleItemRefChange(item.moduleId, element)
                        })()
                      : undefined
                  }
                  onPointerDown={(event) =>
                    item.moduleId && !isDragShell
                      ? onModuleItemPointerDown(event, item.moduleId, item.id)
                      : undefined
                  }
                  className={`relative transition-transform duration-120 ${
                    item.moduleId && !isDragShell
                      ? "cursor-grab active:cursor-grabbing"
                      : ""
                  } ${
                    activeDragSurface === "module" &&
                    draggedModuleId === item.moduleId
                        ? "scale-[0.98]"
                      : ""
                  }`}
                >
                  {isDragShell && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                    />
                  )}
                  <Link
                    href={`#${item.id}`}
                    draggable={false}
                    aria-current={isItemActive ? "location" : undefined}
                    onDragStart={(event) => event.preventDefault()}
                    onClick={
                      isDragShell
                        ? undefined
                        : (event) =>
                            onModuleItemClick(event, item.id, `#${item.id}`)
                    }
                    className={`${getSidebarItemClassName(isItemActive)} ${
                      isDragShell
                        ? "pointer-events-none opacity-0"
                        : activeDragSurface === "module" &&
                            draggedModuleId === item.moduleId
                          ? "border-indigo-200 bg-indigo-50/95 font-medium text-indigo-900 shadow-sm ring-1 ring-indigo-100"
                        : ""
                    } ${itemIndex > 0 ? "mt-2" : ""}`}
                  >
                    {item.label}
                  </Link>
                </div>
              </div>
            )
          })}

          {draggedSortableItem && draggedNavItemFrame && (
            <div
              ref={(element) =>
                draggedSortableItem.moduleId
                  ? onDraggedNavItemOverlayRefChange(
                      draggedSortableItem.moduleId,
                      element
                    )
                  : undefined
              }
              className="relative scale-[0.985] cursor-grabbing"
              style={{
                position: "fixed",
                left: `${draggedNavItemFrame.left}px`,
                top: `${draggedNavItemFrame.top}px`,
                width: `${draggedNavItemFrame.width}px`,
                zIndex: 20,
                transition: "none",
              }}
            >
              <div className="block rounded-xl border border-indigo-200 bg-indigo-50/95 px-3 py-3 text-sm font-medium text-indigo-900 shadow-md ring-1 ring-indigo-100 opacity-90">
                {draggedSortableItem.label}
              </div>
            </div>
          )}
        </div>

        <div className="mt-2">
          <SidebarItem
            disabled={isAddDisabled}
            onClick={onAddModule}
            className="flex h-11 w-full items-center justify-center border-dashed text-lg font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            +
          </SidebarItem>
        </div>
      </nav>
    </Sidebar>
  )
}
