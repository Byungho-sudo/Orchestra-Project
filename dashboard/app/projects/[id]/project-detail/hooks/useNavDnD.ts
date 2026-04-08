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
    cancel: (event: globalThis.PointerEvent) => void
    move: (event: globalThis.PointerEvent) => void
    up: () => void
  } | null>(null)
  const navItemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const draggedNavOverlayElementRef = useRef<HTMLDivElement | null>(null)
  const navListRef = useRef<HTMLDivElement | null>(null)
  const suppressNavClickRef = useRef<string | null>(null)
  const navDropSlotIndexRef = useRef<number | null>(null)
  const navSlotMidpointsRef = useRef<number[] | null>(null)

  const detachNavPointerListeners = useCallback(() => {
    if (!navPointerListenersRef.current || typeof window === "undefined") {
      return
    }

    window.removeEventListener("pointermove", navPointerListenersRef.current.move)
    window.removeEventListener(
      "pointercancel",
      navPointerListenersRef.current.cancel
    )
    window.removeEventListener("pointerup", navPointerListenersRef.current.up)
    navPointerListenersRef.current = null
  }, [])

  const updateDraggedNavItemVisualPosition = useCallback((moduleId: string) => {
    const navItemElement = draggedNavOverlayElementRef.current

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
    (clientY: number) => {
      const slotMidpoints = navSlotMidpointsRef.current

      if (!slotMidpoints || slotMidpoints.length === 0) {
        return null
      }

      for (let slotIndex = 0; slotIndex < slotMidpoints.length; slotIndex += 1) {
        const itemMidpoint = slotMidpoints[slotIndex]

        if (clientY < itemMidpoint) {
          const nextSlotIndex = slotIndex
          const currentSlotIndex = navDropSlotIndexRef.current

          if (
            currentSlotIndex === null ||
            currentSlotIndex === nextSlotIndex ||
            Math.abs(currentSlotIndex - nextSlotIndex) > 1
          ) {
            return nextSlotIndex
          }

          const boundaryIndex = Math.min(currentSlotIndex, nextSlotIndex)
          const boundaryMidpoint = slotMidpoints[boundaryIndex]
          const hysteresisBufferPx = 14

          if (boundaryMidpoint === undefined) {
            return nextSlotIndex
          }

          if (nextSlotIndex > currentSlotIndex) {
            return clientY > boundaryMidpoint + hysteresisBufferPx
              ? nextSlotIndex
              : currentSlotIndex
          }

          return clientY < boundaryMidpoint - hysteresisBufferPx
            ? nextSlotIndex
            : currentSlotIndex
        }
      }

      const nextSlotIndex = slotMidpoints.length
      const currentSlotIndex = navDropSlotIndexRef.current

      if (
        currentSlotIndex === null ||
        currentSlotIndex === nextSlotIndex ||
        Math.abs(currentSlotIndex - nextSlotIndex) > 1
      ) {
        return nextSlotIndex
      }

      const boundaryIndex = nextSlotIndex - 1
      const boundaryMidpoint = slotMidpoints[boundaryIndex]
      const hysteresisBufferPx = 14

      if (boundaryMidpoint === undefined) {
        return nextSlotIndex
      }

      return clientY > boundaryMidpoint + hysteresisBufferPx
        ? nextSlotIndex
        : currentSlotIndex
    },
    []
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
          navSlotMidpointsRef.current = sortedWorkspaceModules
            .filter((workspaceModule) => workspaceModule.id !== moduleId)
            .map((workspaceModule) => {
              const navItemElement = navItemRefs.current[workspaceModule.id]

              if (!navItemElement) {
                return null
              }

              const bounds = navItemElement.getBoundingClientRect()

              return bounds.top + bounds.height / 2
            })
            .filter((midpoint): midpoint is number => midpoint !== null)
          const nextDraggedNavItemFrame = {
            moduleId,
            left: navItemBounds.left,
            top: navItemBounds.top,
            width: navItemBounds.width,
            height: navItemBounds.height,
          }
          const initialSlotIndex = sortedWorkspaceModules.findIndex(
            (workspaceModule) => workspaceModule.id === moduleId
          )
          draggedNavItemFrameRef.current = nextDraggedNavItemFrame
          setDraggedNavItemFrame(nextDraggedNavItemFrame)
          navDropSlotIndexRef.current =
            initialSlotIndex === -1 ? null : initialSlotIndex
          setNavDropSlotIndex(initialSlotIndex === -1 ? null : initialSlotIndex)
        }

        navPointerPositionRef.current = { y: moveEvent.clientY }
        updateDraggedNavItemVisualPosition(moduleId)
        const nextSlotIndex = getNavDropSlotIndexFromPointer(moveEvent.clientY)
        navDropSlotIndexRef.current = nextSlotIndex
        setNavDropSlotIndex((currentSlotIndex) =>
          currentSlotIndex === nextSlotIndex ? currentSlotIndex : nextSlotIndex
        )
      }

      const finalizeNavPointerDrag = async (options?: { cancel?: boolean }) => {
        const dragContext = navDragContextRef.current

        navDragContextRef.current = null
        draggedNavItemFrameRef.current = null
        navPointerPositionRef.current = null
        navSlotMidpointsRef.current = null
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
          if (options?.cancel) {
            setDraggedNavItemFrame(null)
            await commitModuleDrop(null, null)
          }
          return
        }

        setDraggedNavItemFrame(null)

        if (options?.cancel) {
          await commitModuleDrop(null, null)
          return
        }

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

      const handlePointerUp = async () => {
        if (navDragContextRef.current) {
          navPointerPositionRef.current = { y: navDragContextRef.current.startY }
        }
        await finalizeNavPointerDrag()
      }

      const handlePointerCancel = async () => {
        await finalizeNavPointerDrag({ cancel: true })
      }

      navPointerListenersRef.current = {
        cancel: handlePointerCancel,
        move: handlePointerMove,
        up: handlePointerUp,
      }

      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointercancel", handlePointerCancel)
      window.addEventListener("pointerup", handlePointerUp, { once: true })
    },
    [
      commitModuleDrop,
      detachNavPointerListeners,
      getNavDropSlotIndexFromPointer,
      isDragDisabled,
      sortedWorkspaceModules,
      startSharedDrag,
      updateDraggedNavItemVisualPosition,
    ]
  )

  const handleNavItemRefChange = useCallback(
    (moduleId: string, element: HTMLDivElement | null) => {
      navItemRefs.current[moduleId] = element

      if (element && draggedNavItemFrame?.moduleId !== moduleId) {
        element.style.transform = ""
      }
    },
    [draggedNavItemFrame?.moduleId]
  )

  const handleDraggedNavItemOverlayRefChange = useCallback(
    (moduleId: string, element: HTMLDivElement | null) => {
      if (draggedNavItemFrame?.moduleId !== moduleId) {
        return
      }

      draggedNavOverlayElementRef.current = element

      if (!element) {
        return
      }

      updateDraggedNavItemVisualPosition(moduleId)
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
      navSlotMidpointsRef.current = null
      navDropSlotIndexRef.current = null
      setNavDropSlotIndex(null)
    }
  }, [activeDragSurface])

  useEffect(() => {
    if (!activeDragModuleId || activeDragSurface !== "nav") {
      navSlotMidpointsRef.current = null
      draggedNavItemFrameRef.current = null
      draggedNavOverlayElementRef.current = null
      setDraggedNavItemFrame(null)
    }
  }, [activeDragModuleId, activeDragSurface])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleWindowBlur = () => {
      if (!navDragContextRef.current) {
        return
      }

      navDragContextRef.current = null
      draggedNavItemFrameRef.current = null
      draggedNavOverlayElementRef.current = null
      navPointerPositionRef.current = null
      navSlotMidpointsRef.current = null
      navDropSlotIndexRef.current = null
      setDraggedNavItemFrame(null)
      setNavDropSlotIndex(null)
      if (navVisualFrameRef.current) {
        cancelAnimationFrame(navVisualFrameRef.current)
        navVisualFrameRef.current = null
      }
      detachNavPointerListeners()
      void commitModuleDrop(null, null)
    }

    window.addEventListener("blur", handleWindowBlur)

    return () => {
      window.removeEventListener("blur", handleWindowBlur)
    }
  }, [commitModuleDrop, detachNavPointerListeners])

  useEffect(() => {
    return () => {
      if (navVisualFrameRef.current) {
        cancelAnimationFrame(navVisualFrameRef.current)
      }
      navSlotMidpointsRef.current = null
      detachNavPointerListeners()
      draggedNavOverlayElementRef.current = null
    }
  }, [detachNavPointerListeners])

  return {
    draggedNavItemFrame,
    handleNavItemClick,
    handleDraggedNavItemOverlayRefChange,
    handleNavItemPointerDown,
    handleNavItemRefChange,
    navListRef,
    navDropSlotIndex,
  }
}
