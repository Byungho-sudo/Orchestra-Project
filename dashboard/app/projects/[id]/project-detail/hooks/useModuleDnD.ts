import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react"
import { reorderWorkspaceModulesByDrop } from "../helpers"
import type {
  ModuleDropPosition,
  ProjectWorkspaceModule,
} from "../types"

type DropTarget = {
  moduleId: string
  position: ModuleDropPosition
} | null

export function useModuleDnD({
  isDragDisabled,
  persistWorkspaceModuleOrder,
  sortedWorkspaceModules,
}: {
  isDragDisabled: boolean
  persistWorkspaceModuleOrder: (
    nextModules: ProjectWorkspaceModule[],
    activeModuleId: string | null
  ) => Promise<unknown>
  sortedWorkspaceModules: ProjectWorkspaceModule[]
}) {
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null)
  const [draggedModuleFrame, setDraggedModuleFrame] = useState<{
    moduleId: string
    left: number
    top: number
    width: number
    height: number
  } | null>(null)
  const [moduleDropTarget, setModuleDropTarget] = useState<DropTarget>(null)

  const dragAutoScrollFrameRef = useRef<number | null>(null)
  const dragAutoScrollVelocityRef = useRef(0)
  const dragUsesTouchScrollRef = useRef(false)
  const moduleDropTargetRef = useRef<DropTarget>(null)
  const pointerDragContextRef = useRef<{
    moduleId: string
    grabOffsetX: number
    grabOffsetY: number
  } | null>(null)
  const pointerPositionRef = useRef<{ x: number; y: number } | null>(null)
  const pointerDragListenersRef = useRef<{
    move: (event: globalThis.PointerEvent) => void
    up: (event: globalThis.PointerEvent) => void
  } | null>(null)
  const moduleSectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const stopDragAutoScroll = useCallback(() => {
    dragAutoScrollVelocityRef.current = 0

    if (dragAutoScrollFrameRef.current) {
      cancelAnimationFrame(dragAutoScrollFrameRef.current)
      dragAutoScrollFrameRef.current = null
    }
  }, [])

  const startDragAutoScroll = useCallback(() => {
    if (dragAutoScrollFrameRef.current || typeof window === "undefined") {
      return
    }

    const step = () => {
      const velocity = dragAutoScrollVelocityRef.current

      if (!velocity) {
        dragAutoScrollFrameRef.current = null
        return
      }

      const maxScrollTop =
        document.documentElement.scrollHeight - window.innerHeight
      const remainingScrollDown = Math.max(0, maxScrollTop - window.scrollY)
      const remainingScrollUp = Math.max(0, window.scrollY)
      const boundedVelocity =
        velocity > 0
          ? Math.min(velocity, remainingScrollDown)
          : -1 * Math.min(Math.abs(velocity), remainingScrollUp)

      if (!boundedVelocity) {
        stopDragAutoScroll()
        return
      }

      window.scrollBy({
        top: boundedVelocity,
        left: 0,
        behavior: "auto",
      })

      dragAutoScrollFrameRef.current = window.requestAnimationFrame(step)
    }

    dragAutoScrollFrameRef.current = window.requestAnimationFrame(step)
  }, [stopDragAutoScroll])

  const updateDragAutoScroll = useCallback(
    (clientY: number) => {
      if (typeof window === "undefined") return
      if (!dragUsesTouchScrollRef.current) {
        stopDragAutoScroll()
        return
      }

      const edgeZone = 96
      const maxVelocity = 10
      const viewportHeight = window.innerHeight
      let velocity = 0

      if (clientY < edgeZone) {
        const edgeProgress = (edgeZone - clientY) / edgeZone
        velocity = -1 * Math.max(1.5, edgeProgress * edgeProgress * maxVelocity)
      } else if (clientY > viewportHeight - edgeZone) {
        const edgeProgress =
          (clientY - (viewportHeight - edgeZone)) / edgeZone
        velocity = Math.max(1.5, edgeProgress * edgeProgress * maxVelocity)
      }

      dragAutoScrollVelocityRef.current = velocity

      if (velocity) {
        startDragAutoScroll()
        return
      }

      stopDragAutoScroll()
    },
    [startDragAutoScroll, stopDragAutoScroll]
  )

  const updateSharedDropTarget = useCallback((nextTarget: DropTarget) => {
    if (
      moduleDropTargetRef.current?.moduleId === nextTarget?.moduleId &&
      moduleDropTargetRef.current?.position === nextTarget?.position
    ) {
      return
    }

    moduleDropTargetRef.current = nextTarget
    setModuleDropTarget(nextTarget)
  }, [])

  const clearDragState = useCallback(() => {
    stopDragAutoScroll()
    dragUsesTouchScrollRef.current = false
    pointerPositionRef.current = null
    moduleDropTargetRef.current = null
    setDraggedModuleId(null)
    setDraggedModuleFrame(null)
    setModuleDropTarget(null)
  }, [stopDragAutoScroll])

  const startSharedDrag = useCallback(
    (moduleId: string) => {
      setDraggedModuleId(moduleId)
      setDraggedModuleFrame(null)
      updateSharedDropTarget(null)
    },
    [updateSharedDropTarget]
  )

  const commitModuleDrop = useCallback(
    async (
      draggedId: string | null,
      targetModuleId: string,
      dropPosition: ModuleDropPosition | null
    ) => {
      clearDragState()

      if (!draggedId || !dropPosition || draggedId === targetModuleId) {
        return
      }

      const reorderedModules = reorderWorkspaceModulesByDrop(
        sortedWorkspaceModules,
        draggedId,
        targetModuleId,
        dropPosition
      )

      await persistWorkspaceModuleOrder(reorderedModules, draggedId)
    },
    [clearDragState, persistWorkspaceModuleOrder, sortedWorkspaceModules]
  )

  const detachPointerDragListeners = useCallback(() => {
    if (!pointerDragListenersRef.current || typeof window === "undefined") {
      return
    }

    window.removeEventListener(
      "pointermove",
      pointerDragListenersRef.current.move
    )
    window.removeEventListener("pointerup", pointerDragListenersRef.current.up)
    pointerDragListenersRef.current = null
  }, [])

  const getModuleDropTargetFromPointer = useCallback(
    (clientY: number, draggedId: string) => {
      let closestTarget: {
        moduleId: string
        position: ModuleDropPosition
        distance: number
      } | null = null

      for (const workspaceModule of sortedWorkspaceModules) {
        if (workspaceModule.id === draggedId) continue

        const sectionElement = moduleSectionRefs.current[workspaceModule.id]

        if (!sectionElement) continue

        const bounds = sectionElement.getBoundingClientRect()
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

  const updateDraggedModuleVisualPosition = useCallback((moduleId: string) => {
    const dragContext = pointerDragContextRef.current
    const pointerPosition = pointerPositionRef.current
    const sectionElement = moduleSectionRefs.current[moduleId]

    if (
      !dragContext ||
      dragContext.moduleId !== moduleId ||
      !pointerPosition ||
      !sectionElement
    ) {
      return
    }

    const desiredLeft = pointerPosition.x - dragContext.grabOffsetX
    const desiredTop = pointerPosition.y - dragContext.grabOffsetY

    sectionElement.style.left = `${desiredLeft}px`
    sectionElement.style.top = `${desiredTop}px`
  }, [])

  const handleModulePointerDragStart = useCallback(
    (event: PointerEvent<HTMLElement>, moduleId: string) => {
      if (event.button !== 0 && event.pointerType !== "touch") {
        return
      }

      if (isDragDisabled) {
        return
      }

      event.preventDefault()

      const sectionElement = moduleSectionRefs.current[moduleId]
      const sectionBounds = sectionElement?.getBoundingClientRect()

      pointerDragContextRef.current = {
        moduleId,
        grabOffsetX: sectionBounds ? event.clientX - sectionBounds.left : 0,
        grabOffsetY: sectionBounds ? event.clientY - sectionBounds.top : 0,
      }
      pointerPositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      }
      dragUsesTouchScrollRef.current = event.pointerType !== "mouse"
      startSharedDrag(moduleId)
      setDraggedModuleFrame(
        sectionBounds
          ? {
              moduleId,
              left: sectionBounds.left,
              top: sectionBounds.top,
              width: sectionBounds.width,
              height: sectionBounds.height,
            }
          : null
      )
      detachPointerDragListeners()

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const dragContext = pointerDragContextRef.current

        if (!dragContext || dragContext.moduleId !== moduleId) {
          return
        }

        pointerPositionRef.current = {
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        }
        updateDraggedModuleVisualPosition(moduleId)
        updateDragAutoScroll(moveEvent.clientY)

        updateSharedDropTarget(
          getModuleDropTargetFromPointer(moveEvent.clientY, moduleId)
        )
      }

      const handlePointerUp = async () => {
        const dragContext = pointerDragContextRef.current

        pointerDragContextRef.current = null
        detachPointerDragListeners()
        stopDragAutoScroll()

        await commitModuleDrop(
          dragContext?.moduleId ?? null,
          moduleDropTargetRef.current?.moduleId ?? moduleId,
          moduleDropTargetRef.current?.position ?? null
        )
      }

      pointerDragListenersRef.current = {
        move: handlePointerMove,
        up: handlePointerUp,
      }

      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp, { once: true })
    },
    [
      commitModuleDrop,
      detachPointerDragListeners,
      getModuleDropTargetFromPointer,
      isDragDisabled,
      startSharedDrag,
      stopDragAutoScroll,
      updateDragAutoScroll,
      updateDraggedModuleVisualPosition,
      updateSharedDropTarget,
    ]
  )

  const handleModuleSectionRefChange = useCallback(
    (moduleId: string, element: HTMLElement | null) => {
      moduleSectionRefs.current[moduleId] = element

      if (draggedModuleId === moduleId) {
        updateDraggedModuleVisualPosition(moduleId)
      }
    },
    [draggedModuleId, updateDraggedModuleVisualPosition]
  )

  useEffect(() => {
    return () => {
      stopDragAutoScroll()
      detachPointerDragListeners()
    }
  }, [detachPointerDragListeners, stopDragAutoScroll])

  return {
    commitModuleDrop,
    draggedModuleFrame,
    draggedModuleId,
    handleModulePointerDragStart,
    handleModuleSectionRefChange,
    moduleDropTarget,
    startSharedDrag,
    updateSharedDropTarget,
  }
}
