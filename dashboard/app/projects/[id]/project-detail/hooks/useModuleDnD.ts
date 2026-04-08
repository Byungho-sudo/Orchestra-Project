import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react"
import { reorderWorkspaceModulesBySlot } from "../helpers"
import type { ProjectWorkspaceModule } from "../types"

export type DragSurface = "module" | "nav" | null

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
  const [activeDragSurface, setActiveDragSurface] = useState<DragSurface>(null)
  const [projectedDropSurface, setProjectedDropSurface] =
    useState<DragSurface>(null)
  const [moduleDropSlotIndex, setModuleDropSlotIndex] = useState<number | null>(
    null
  )
  const [draggedModuleFrame, setDraggedModuleFrame] = useState<{
    moduleId: string
    left: number
    top: number
    width: number
    height: number
  } | null>(null)
  const dragAutoScrollFrameRef = useRef<number | null>(null)
  const draggedModuleFrameRef = useRef<{
    moduleId: string
    left: number
    top: number
    width: number
    height: number
  } | null>(null)
  const dragAutoScrollVelocityRef = useRef(0)
  const dragVisualFrameRef = useRef<number | null>(null)
  const dragUsesTouchScrollRef = useRef(false)
  const projectedDropSurfaceRef = useRef<DragSurface>(null)
  const moduleDropSlotIndexRef = useRef<number | null>(null)
  const pointerDragContextRef = useRef<{
    moduleId: string
    grabOffsetX: number
    grabOffsetY: number
    hasStartedDragging: boolean
    startX: number
    startY: number
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

  const updateProjectedDropSurface = useCallback((nextSurface: DragSurface) => {
    if (projectedDropSurfaceRef.current === nextSurface) {
      return
    }

    projectedDropSurfaceRef.current = nextSurface
    setProjectedDropSurface((currentSurface) =>
      currentSurface === nextSurface ? currentSurface : nextSurface
    )
  }, [])

  const clearDragState = useCallback(() => {
    stopDragAutoScroll()
    dragUsesTouchScrollRef.current = false
    draggedModuleFrameRef.current = null
    pointerPositionRef.current = null
    projectedDropSurfaceRef.current = null
    moduleDropSlotIndexRef.current = null
    if (dragVisualFrameRef.current) {
      cancelAnimationFrame(dragVisualFrameRef.current)
      dragVisualFrameRef.current = null
    }
    setActiveDragSurface(null)
    setProjectedDropSurface(null)
    setModuleDropSlotIndex(null)
    setDraggedModuleId(null)
    setDraggedModuleFrame(null)
  }, [stopDragAutoScroll])

  const startSharedDrag = useCallback(
    (moduleId: string, dragSurface: Exclude<DragSurface, null>) => {
      setActiveDragSurface(dragSurface)
      setDraggedModuleId(moduleId)
      draggedModuleFrameRef.current = null
      setDraggedModuleFrame(null)
      moduleDropSlotIndexRef.current = null
      setModuleDropSlotIndex(null)
      updateProjectedDropSurface(null)
    },
    [updateProjectedDropSurface]
  )

  const commitModuleDrop = useCallback(
    async (draggedId: string | null, slotIndex: number | null) => {
      clearDragState()

      if (!draggedId || slotIndex === null) {
        return
      }

      const reorderedModules = reorderWorkspaceModulesBySlot(
        sortedWorkspaceModules,
        draggedId,
        slotIndex
      )

      const orderUnchanged = reorderedModules.every(
        (module, moduleIndex) => module.id === sortedWorkspaceModules[moduleIndex]?.id
      )

      if (orderUnchanged) {
        return
      }

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

  const getModuleDropSlotIndexFromPointer = useCallback(
    (clientY: number, draggedId: string) => {
      const sortableModules = sortedWorkspaceModules.filter(
        (workspaceModule) => workspaceModule.id !== draggedId
      )

      if (sortableModules.length === 0) {
        return null
      }

      for (let slotIndex = 0; slotIndex < sortableModules.length; slotIndex += 1) {
        const sectionElement = moduleSectionRefs.current[sortableModules[slotIndex].id]

        if (!sectionElement) continue

        const bounds = sectionElement.getBoundingClientRect()
        const moduleMidpoint = bounds.top + bounds.height / 2

        if (clientY < moduleMidpoint) {
          return slotIndex
        }
      }

      return sortableModules.length
    },
    [sortedWorkspaceModules]
  )

  const updateDraggedModuleVisualPosition = useCallback((moduleId: string) => {
    const sectionElement = moduleSectionRefs.current[moduleId]

    if (!sectionElement || dragVisualFrameRef.current) {
      return
    }

    dragVisualFrameRef.current = window.requestAnimationFrame(() => {
      dragVisualFrameRef.current = null

      const dragContext = pointerDragContextRef.current
      const pointerPosition = pointerPositionRef.current
      const dragFrame = draggedModuleFrameRef.current

      if (
        !dragContext ||
        dragContext.moduleId !== moduleId ||
        !pointerPosition ||
        !sectionElement ||
        !dragFrame
      ) {
        return
      }

      const desiredLeft = pointerPosition.x - dragContext.grabOffsetX
      const desiredTop = pointerPosition.y - dragContext.grabOffsetY
      const offsetX = desiredLeft - dragFrame.left
      const offsetY = desiredTop - dragFrame.top

      sectionElement.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`
    })
  }, [])

  const handleModulePointerDragStart = useCallback(
    (event: PointerEvent<HTMLElement>, moduleId: string) => {
      if (event.button !== 0 && event.pointerType !== "touch") {
        return
      }

      if (isDragDisabled) {
        return
      }

      const sectionElement = moduleSectionRefs.current[moduleId]
      const sectionBounds = sectionElement?.getBoundingClientRect()
      const isTouchPointer = event.pointerType !== "mouse"

      pointerDragContextRef.current = {
        moduleId,
        grabOffsetX: sectionBounds ? event.clientX - sectionBounds.left : 0,
        grabOffsetY: sectionBounds ? event.clientY - sectionBounds.top : 0,
        hasStartedDragging: !isTouchPointer,
        startX: event.clientX,
        startY: event.clientY,
      }
      pointerPositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      }
      dragUsesTouchScrollRef.current = isTouchPointer

      if (!isTouchPointer) {
        event.preventDefault()
        startSharedDrag(moduleId, "module")
        const nextDraggedModuleFrame = sectionBounds
          ? {
              moduleId,
              left: sectionBounds.left,
              top: sectionBounds.top,
              width: sectionBounds.width,
              height: sectionBounds.height,
            }
          : null
        draggedModuleFrameRef.current = nextDraggedModuleFrame
        setDraggedModuleFrame(nextDraggedModuleFrame)
      }
      detachPointerDragListeners()

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const dragContext = pointerDragContextRef.current

        if (!dragContext || dragContext.moduleId !== moduleId) {
          return
        }

        if (!dragContext.hasStartedDragging) {
          const moveDistanceX = Math.abs(moveEvent.clientX - dragContext.startX)
          const moveDistanceY = Math.abs(moveEvent.clientY - dragContext.startY)

          if (Math.max(moveDistanceX, moveDistanceY) < 8) {
            return
          }

          dragContext.hasStartedDragging = true
          moveEvent.preventDefault()
          startSharedDrag(moduleId, "module")
          const latestSectionBounds =
            moduleSectionRefs.current[moduleId]?.getBoundingClientRect() ?? null
          const nextDraggedModuleFrame = latestSectionBounds
            ? {
                moduleId,
                left: latestSectionBounds.left,
                top: latestSectionBounds.top,
                width: latestSectionBounds.width,
                height: latestSectionBounds.height,
              }
            : null
          draggedModuleFrameRef.current = nextDraggedModuleFrame
          setDraggedModuleFrame(nextDraggedModuleFrame)
        }

        pointerPositionRef.current = {
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        }
        updateDraggedModuleVisualPosition(moduleId)
        updateDragAutoScroll(moveEvent.clientY)
        const nextSlotIndex = getModuleDropSlotIndexFromPointer(
          moveEvent.clientY,
          moduleId
        )

        if (moduleDropSlotIndexRef.current !== nextSlotIndex) {
          moduleDropSlotIndexRef.current = nextSlotIndex
          setModuleDropSlotIndex((currentSlotIndex) =>
            currentSlotIndex === nextSlotIndex ? currentSlotIndex : nextSlotIndex
          )
        }

        updateProjectedDropSurface(nextSlotIndex === null ? null : "module")
      }

      const handlePointerUp = async () => {
        const dragContext = pointerDragContextRef.current

        pointerDragContextRef.current = null
        detachPointerDragListeners()
        stopDragAutoScroll()

        await commitModuleDrop(
          dragContext?.hasStartedDragging ? dragContext.moduleId : null,
          moduleDropSlotIndexRef.current
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
      getModuleDropSlotIndexFromPointer,
      isDragDisabled,
      startSharedDrag,
      stopDragAutoScroll,
      updateDragAutoScroll,
      updateDraggedModuleVisualPosition,
      updateProjectedDropSurface,
    ]
  )

  const handleModuleSectionRefChange = useCallback(
    (moduleId: string, element: HTMLElement | null) => {
      moduleSectionRefs.current[moduleId] = element

      if (element && draggedModuleId !== moduleId) {
        element.style.transform = ""
      }

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
    activeDragSurface,
    commitModuleDrop,
    draggedModuleFrame,
    draggedModuleId,
    handleModulePointerDragStart,
    handleModuleSectionRefChange,
    moduleDropSlotIndex,
    projectedDropSurface,
    startSharedDrag,
    updateProjectedDropSurface,
  }
}
