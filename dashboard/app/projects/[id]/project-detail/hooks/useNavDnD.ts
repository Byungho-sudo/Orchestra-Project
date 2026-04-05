import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react"
import type { ModuleDropPosition, ProjectWorkspaceModule } from "../types"

type DropTarget = {
  moduleId: string
  position: ModuleDropPosition
} | null

export function useNavDnD({
  activeDragModuleId,
  commitModuleDrop,
  isDragDisabled,
  sortedWorkspaceModules,
  startSharedDrag,
  updateSharedDropTarget,
}: {
  activeDragModuleId: string | null
  commitModuleDrop: (
    draggedId: string | null,
    targetModuleId: string,
    dropPosition: ModuleDropPosition | null
  ) => Promise<void>
  isDragDisabled: boolean
  sortedWorkspaceModules: ProjectWorkspaceModule[]
  startSharedDrag: (moduleId: string) => void
  updateSharedDropTarget: (nextTarget: DropTarget) => void
}) {
  const [draggedNavItemFrame, setDraggedNavItemFrame] = useState<{
    moduleId: string
    left: number
    top: number
    width: number
    height: number
  } | null>(null)

  const navDragContextRef = useRef<{
    moduleId: string
    itemId: string
    startY: number
    grabOffsetY: number
    itemHeight: number
    startedDragging: boolean
  } | null>(null)
  const navPointerPositionRef = useRef<{ y: number } | null>(null)
  const navPointerListenersRef = useRef<{
    move: (event: globalThis.PointerEvent) => void
    up: () => void
  } | null>(null)
  const navItemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const navListRef = useRef<HTMLDivElement | null>(null)
  const suppressNavClickRef = useRef<string | null>(null)
  const moduleDropTargetRef = useRef<DropTarget>(null)

  const detachNavPointerListeners = useCallback(() => {
    if (!navPointerListenersRef.current || typeof window === "undefined") {
      return
    }

    window.removeEventListener("pointermove", navPointerListenersRef.current.move)
    window.removeEventListener("pointerup", navPointerListenersRef.current.up)
    navPointerListenersRef.current = null
  }, [])

  const updateDraggedNavItemVisualPosition = useCallback((moduleId: string) => {
    const dragContext = navDragContextRef.current
    const pointerPosition = navPointerPositionRef.current
    const navItemElement = navItemRefs.current[moduleId]
    const navListElement = navListRef.current

    if (
      !dragContext ||
      dragContext.moduleId !== moduleId ||
      !pointerPosition ||
      !navItemElement ||
      !navListElement
    ) {
      return
    }

    const navListBounds = navListElement.getBoundingClientRect()
    const unclampedTop = pointerPosition.y - dragContext.grabOffsetY
    const clampedTop = Math.min(
      Math.max(unclampedTop, navListBounds.top),
      navListBounds.bottom - dragContext.itemHeight
    )

    navItemElement.style.left = `${navListBounds.left}px`
    navItemElement.style.top = `${clampedTop}px`
  }, [])

  const getNavDropTargetFromPointer = useCallback(
    (clientY: number, draggedId: string) => {
      let closestTarget: {
        moduleId: string
        position: ModuleDropPosition
        distance: number
      } | null = null

      for (const workspaceModule of sortedWorkspaceModules) {
        if (workspaceModule.id === draggedId) continue

        const navItemElement = navItemRefs.current[workspaceModule.id]

        if (!navItemElement) continue

        const bounds = navItemElement.getBoundingClientRect()
        const beforeDistance = Math.abs(clientY - bounds.top)
        const afterDistance = Math.abs(clientY - bounds.bottom)

        if (!closestTarget || beforeDistance < closestTarget.distance) {
          closestTarget = {
            moduleId: workspaceModule.id,
            position: "before",
            distance: beforeDistance,
          }
        }

        if (!closestTarget || afterDistance < closestTarget.distance) {
          closestTarget = {
            moduleId: workspaceModule.id,
            position: "after",
            distance: afterDistance,
          }
        }
      }

      if (!closestTarget) return null

      return {
        moduleId: closestTarget.moduleId,
        position: closestTarget.position,
      } satisfies NonNullable<DropTarget>
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
          startSharedDrag(moduleId)
          setDraggedNavItemFrame({
            moduleId,
            left: navItemBounds.left,
            top: navItemBounds.top,
            width: navItemBounds.width,
            height: navItemBounds.height,
          })
          moduleDropTargetRef.current = null
          updateSharedDropTarget(null)
        }

        navPointerPositionRef.current = { y: moveEvent.clientY }
        updateDraggedNavItemVisualPosition(moduleId)
        const nextTarget = getNavDropTargetFromPointer(moveEvent.clientY, moduleId)
        moduleDropTargetRef.current = nextTarget
        updateSharedDropTarget(nextTarget)
      }

      const handlePointerUp = async () => {
        const dragContext = navDragContextRef.current

        navDragContextRef.current = null
        navPointerPositionRef.current = null
        detachNavPointerListeners()

        if (!dragContext) {
          return
        }

        if (!dragContext.startedDragging) {
          return
        }

        setDraggedNavItemFrame(null)

        await commitModuleDrop(
          dragContext.moduleId,
          moduleDropTargetRef.current?.moduleId ?? dragContext.moduleId,
          moduleDropTargetRef.current?.position ?? null
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
      getNavDropTargetFromPointer,
      isDragDisabled,
      startSharedDrag,
      updateDraggedNavItemVisualPosition,
      updateSharedDropTarget,
    ]
  )

  const handleNavItemRefChange = useCallback(
    (moduleId: string, element: HTMLDivElement | null) => {
      navItemRefs.current[moduleId] = element

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
    moduleDropTargetRef.current = null
  }, [activeDragModuleId])

  useEffect(() => {
    if (!activeDragModuleId) {
      setDraggedNavItemFrame(null)
    }
  }, [activeDragModuleId])

  useEffect(() => {
    return () => {
      detachNavPointerListeners()
    }
  }, [detachNavPointerListeners])

  return {
    draggedNavItemFrame,
    handleNavItemClick,
    handleNavItemPointerDown,
    handleNavItemRefChange,
    navListRef,
  }
}
