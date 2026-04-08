import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react"
import type { DragSurface } from "./useModuleDnD"
import type { ProjectWorkspaceModule } from "../types"

export function useNavDnD({
  activeDragSurface,
  activeDragModuleId,
  commitModuleDrop,
  isDragDisabled,
  sortedWorkspaceModules,
  startSharedDrag,
  updateProjectedDropSurface,
}: {
  activeDragSurface: DragSurface
  activeDragModuleId: string | null
  commitModuleDrop: (draggedId: string | null, slotIndex: number | null) => Promise<void>
  isDragDisabled: boolean
  sortedWorkspaceModules: ProjectWorkspaceModule[]
  startSharedDrag: (
    moduleId: string,
    dragSurface: Exclude<DragSurface, null>
  ) => void
  updateProjectedDropSurface: (nextSurface: DragSurface) => void
}) {
  const [draggedNavItemFrame, setDraggedNavItemFrame] = useState<{
    moduleId: string
    left: number
    top: number
    width: number
    height: number
  } | null>(null)
  const [navDropSlotIndex, setNavDropSlotIndex] = useState<number | null>(null)

  const navDragContextRef = useRef<{
    moduleId: string
    itemId: string
    startY: number
    grabOffsetY: number
    itemHeight: number
    startedDragging: boolean
  } | null>(null)
  const draggedNavItemFrameRef = useRef<{
    moduleId: string
    left: number
    top: number
    width: number
    height: number
  } | null>(null)
  const navPointerPositionRef = useRef<{ y: number } | null>(null)
  const navVisualFrameRef = useRef<number | null>(null)
  const navPointerListenersRef = useRef<{
    move: (event: globalThis.PointerEvent) => void
    up: () => void
  } | null>(null)
  const navItemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const navListRef = useRef<HTMLDivElement | null>(null)
  const suppressNavClickRef = useRef<string | null>(null)
  const navDropSlotIndexRef = useRef<number | null>(null)

  const detachNavPointerListeners = useCallback(() => {
    if (!navPointerListenersRef.current || typeof window === "undefined") {
      return
    }

    window.removeEventListener("pointermove", navPointerListenersRef.current.move)
    window.removeEventListener("pointerup", navPointerListenersRef.current.up)
    navPointerListenersRef.current = null
  }, [])

  const updateDraggedNavItemVisualPosition = useCallback((moduleId: string) => {
    const navItemElement = navItemRefs.current[moduleId]

    if (!navItemElement || navVisualFrameRef.current) {
      return
    }

    navVisualFrameRef.current = window.requestAnimationFrame(() => {
      navVisualFrameRef.current = null

      const dragContext = navDragContextRef.current
      const pointerPosition = navPointerPositionRef.current
      const navListElement = navListRef.current
      const dragFrame = draggedNavItemFrameRef.current

      if (
        !dragContext ||
        dragContext.moduleId !== moduleId ||
        !pointerPosition ||
        !navItemElement ||
        !navListElement ||
        !dragFrame
      ) {
        return
      }

      const navListBounds = navListElement.getBoundingClientRect()
      const unclampedTop = pointerPosition.y - dragContext.grabOffsetY
      const clampedTop = Math.min(
        Math.max(unclampedTop, navListBounds.top),
        navListBounds.bottom - dragContext.itemHeight
      )
      const offsetY = clampedTop - dragFrame.top

      navItemElement.style.transform = `translate3d(0, ${offsetY}px, 0)`
    })
  }, [])

  const getNavDropSlotIndexFromPointer = useCallback(
    (clientY: number, draggedId: string) => {
      const sortableItems = sortedWorkspaceModules.filter(
        (workspaceModule) => workspaceModule.id !== draggedId
      )

      if (sortableItems.length === 0) {
        return null
      }

      for (let slotIndex = 0; slotIndex < sortableItems.length; slotIndex += 1) {
        const navItemElement = navItemRefs.current[sortableItems[slotIndex].id]

        if (!navItemElement) continue

        const bounds = navItemElement.getBoundingClientRect()
        const itemMidpoint = bounds.top + bounds.height / 2

        if (clientY < itemMidpoint) {
          return slotIndex
        }
      }

      return sortableItems.length
    },
    [sortedWorkspaceModules]
  )

  const handleNavItemPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>, moduleId: string, itemId: string) => {
      if (event.button !== 0 || isDragDisabled) return

      const navItemElement = navItemRefs.current[moduleId]
      const navItemBounds = navItemElement?.getBoundingClientRect()

      if (!navItemBounds) return

      navDragContextRef.current = {
        moduleId,
        itemId,
        startY: event.clientY,
        grabOffsetY: event.clientY - navItemBounds.top,
        itemHeight: navItemBounds.height,
        startedDragging: false,
      }
      navPointerPositionRef.current = { y: event.clientY }
      suppressNavClickRef.current = null
      detachNavPointerListeners()

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const dragContext = navDragContextRef.current

        if (!dragContext || dragContext.moduleId !== moduleId) {
          return
        }

        const moveDistanceY = Math.abs(moveEvent.clientY - dragContext.startY)

        if (!dragContext.startedDragging) {
          if (moveDistanceY < 7) {
            return
          }

          dragContext.startedDragging = true
          suppressNavClickRef.current = dragContext.itemId
          navPointerPositionRef.current = { y: moveEvent.clientY }
          startSharedDrag(moduleId, "nav")
          const nextDraggedNavItemFrame = {
            moduleId,
            left: navItemBounds.left,
            top: navItemBounds.top,
            width: navItemBounds.width,
            height: navItemBounds.height,
          }
          draggedNavItemFrameRef.current = nextDraggedNavItemFrame
          setDraggedNavItemFrame(nextDraggedNavItemFrame)
          navDropSlotIndexRef.current = null
          setNavDropSlotIndex(null)
          updateProjectedDropSurface(null)
        }

        navPointerPositionRef.current = { y: moveEvent.clientY }
        updateDraggedNavItemVisualPosition(moduleId)
        const nextSlotIndex = getNavDropSlotIndexFromPointer(
          moveEvent.clientY,
          moduleId
        )
        navDropSlotIndexRef.current = nextSlotIndex
        setNavDropSlotIndex((currentSlotIndex) =>
          currentSlotIndex === nextSlotIndex ? currentSlotIndex : nextSlotIndex
        )
        updateProjectedDropSurface(nextSlotIndex === null ? null : "nav")
      }

      const handlePointerUp = async () => {
        const dragContext = navDragContextRef.current

        navDragContextRef.current = null
        draggedNavItemFrameRef.current = null
        navPointerPositionRef.current = null
        detachNavPointerListeners()
        setNavDropSlotIndex(null)
        if (navVisualFrameRef.current) {
          cancelAnimationFrame(navVisualFrameRef.current)
          navVisualFrameRef.current = null
        }

        if (!dragContext) {
          return
        }

        if (!dragContext.startedDragging) {
          return
        }

        setDraggedNavItemFrame(null)

        await commitModuleDrop(
          dragContext.moduleId,
          navDropSlotIndexRef.current
        )

        window.setTimeout(() => {
          if (suppressNavClickRef.current === dragContext.itemId) {
            suppressNavClickRef.current = null
          }
        }, 0)
      }

      navPointerListenersRef.current = {
        move: handlePointerMove,
        up: handlePointerUp,
      }

      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp, { once: true })
    },
    [
      commitModuleDrop,
      detachNavPointerListeners,
      getNavDropSlotIndexFromPointer,
      isDragDisabled,
      startSharedDrag,
      updateDraggedNavItemVisualPosition,
      updateProjectedDropSurface,
    ]
  )

  const handleNavItemRefChange = useCallback(
    (moduleId: string, element: HTMLDivElement | null) => {
      navItemRefs.current[moduleId] = element

      if (element && draggedNavItemFrame?.moduleId !== moduleId) {
        element.style.transform = ""
      }

      if (draggedNavItemFrame?.moduleId === moduleId) {
        updateDraggedNavItemVisualPosition(moduleId)
      }
    },
    [draggedNavItemFrame?.moduleId, updateDraggedNavItemVisualPosition]
  )

  const handleNavItemClick = useCallback(
    (
      event: MouseEvent<HTMLAnchorElement>,
      itemId: string,
      onNavigate: () => void
    ) => {
      if (suppressNavClickRef.current === itemId) {
        event.preventDefault()
        suppressNavClickRef.current = null
        return
      }

      onNavigate()
    },
    []
  )

  useEffect(() => {
    if (activeDragSurface !== "nav") {
      navDropSlotIndexRef.current = null
      setNavDropSlotIndex(null)
    }
  }, [activeDragSurface])

  useEffect(() => {
    if (!activeDragModuleId || activeDragSurface !== "nav") {
      draggedNavItemFrameRef.current = null
      setDraggedNavItemFrame(null)
    }
  }, [activeDragModuleId, activeDragSurface])

  useEffect(() => {
    return () => {
      if (navVisualFrameRef.current) {
        cancelAnimationFrame(navVisualFrameRef.current)
      }
      detachNavPointerListeners()
    }
  }, [detachNavPointerListeners])

  return {
    draggedNavItemFrame,
    handleNavItemClick,
    handleNavItemPointerDown,
    handleNavItemRefChange,
    navListRef,
    navDropSlotIndex,
  }
}
