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
  const [settlingModuleDrop, setSettlingModuleDrop] = useState<{
    moduleId: string
    slotIndex: number
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
    cancel: (event: globalThis.PointerEvent) => void
    move: (event: globalThis.PointerEvent) => void
    up: (event: globalThis.PointerEvent) => void
  } | null>(null)
  const previousDocumentUserSelectRef = useRef<{
    body: string
    documentElement: string
  } | null>(null)
  const moduleSectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const draggedOverlayElementRef = useRef<HTMLElement | null>(null)

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

  const disableDocumentTextSelection = useCallback(() => {
    if (typeof document === "undefined" || previousDocumentUserSelectRef.current) {
      return
    }

    previousDocumentUserSelectRef.current = {
      body: document.body.style.userSelect,
      documentElement: document.documentElement.style.userSelect,
    }

    document.body.style.userSelect = "none"
    document.documentElement.style.userSelect = "none"
  }, [])

  const restoreDocumentTextSelection = useCallback(() => {
    if (typeof document === "undefined" || !previousDocumentUserSelectRef.current) {
      return
    }

    document.body.style.userSelect = previousDocumentUserSelectRef.current.body
    document.documentElement.style.userSelect =
      previousDocumentUserSelectRef.current.documentElement
    previousDocumentUserSelectRef.current = null
  }, [])

  const clearDragState = useCallback(() => {
    stopDragAutoScroll()
    restoreDocumentTextSelection()
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
  }, [restoreDocumentTextSelection, stopDragAutoScroll])

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

  const startModuleDrag = useCallback(
    (
      moduleId: string,
      dragFrame: {
        moduleId: string
        left: number
        top: number
        width: number
        height: number
      } | null,
      initialSlotIndex: number
    ) => {
      disableDocumentTextSelection()
      setActiveDragSurface("module")
      setDraggedModuleId(moduleId)
      draggedModuleFrameRef.current = dragFrame
      setDraggedModuleFrame(dragFrame)
      moduleDropSlotIndexRef.current = initialSlotIndex
      setModuleDropSlotIndex(initialSlotIndex)
      projectedDropSurfaceRef.current = "module"
      setProjectedDropSurface("module")
    },
    [disableDocumentTextSelection]
  )

  const commitModuleDrop = useCallback(
    async (draggedId: string | null, slotIndex: number | null) => {
      if (!draggedId || slotIndex === null) {
        setSettlingModuleDrop(null)
        clearDragState()
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
        setSettlingModuleDrop(null)
        clearDragState()
        return
      }

      setSettlingModuleDrop({
        moduleId: draggedId,
        slotIndex,
      })
      clearDragState()

      try {
        await persistWorkspaceModuleOrder(reorderedModules, draggedId)
      } finally {
        setSettlingModuleDrop(null)
      }
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
    window.removeEventListener(
      "pointercancel",
      pointerDragListenersRef.current.cancel
    )
    window.removeEventListener("pointerup", pointerDragListenersRef.current.up)
    pointerDragListenersRef.current = null
  }, [])

  const getModuleDropSlotIndexFromPointer = useCallback(
    (clientY: number, draggedId: string) => {
      const sortableModules = sortedWorkspaceModules.filter(
        (workspaceModule) => workspaceModule.id !== draggedId
      )
      const slotBoundaryMidpoints: number[] = []

      if (sortableModules.length === 0) {
        return 0
      }

      for (let slotIndex = 0; slotIndex < sortableModules.length; slotIndex += 1) {
        const sectionElement = moduleSectionRefs.current[sortableModules[slotIndex].id]

        if (!sectionElement) continue

        const bounds = sectionElement.getBoundingClientRect()
        const moduleMidpoint = bounds.top + bounds.height / 2
        slotBoundaryMidpoints[slotIndex] = moduleMidpoint

        if (clientY < moduleMidpoint) {
          const nextSlotIndex = slotIndex
          const currentSlotIndex = moduleDropSlotIndexRef.current

          if (
            currentSlotIndex === null ||
            currentSlotIndex === nextSlotIndex ||
            Math.abs(currentSlotIndex - nextSlotIndex) > 1
          ) {
            return nextSlotIndex
          }

          const boundaryIndex = Math.min(currentSlotIndex, nextSlotIndex)
          const boundaryMidpoint = slotBoundaryMidpoints[boundaryIndex]
          const hysteresisBufferPx = 18

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

      const nextSlotIndex = sortableModules.length
      const currentSlotIndex = moduleDropSlotIndexRef.current

      if (
        currentSlotIndex === null ||
        currentSlotIndex === nextSlotIndex ||
        Math.abs(currentSlotIndex - nextSlotIndex) > 1
      ) {
        return nextSlotIndex
      }

      const boundaryIndex = nextSlotIndex - 1
      const boundaryMidpoint = slotBoundaryMidpoints[boundaryIndex]
      const hysteresisBufferPx = 18

      if (boundaryMidpoint === undefined) {
        return nextSlotIndex
      }

      return clientY > boundaryMidpoint + hysteresisBufferPx
        ? nextSlotIndex
        : currentSlotIndex
    },
    [sortedWorkspaceModules]
  )

  const updateDraggedModuleVisualPosition = useCallback((moduleId: string) => {
    const sectionElement = draggedOverlayElementRef.current

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
        hasStartedDragging: false,
        startX: event.clientX,
        startY: event.clientY,
      }
      pointerPositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      }
      dragUsesTouchScrollRef.current = isTouchPointer
      detachPointerDragListeners()

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        const dragContext = pointerDragContextRef.current

        if (!dragContext || dragContext.moduleId !== moduleId) {
          return
        }

        if (!dragContext.hasStartedDragging) {
          const moveDistanceX = Math.abs(moveEvent.clientX - dragContext.startX)
          const moveDistanceY = Math.abs(moveEvent.clientY - dragContext.startY)
          const dragStartThresholdPx = isTouchPointer ? 8 : 4

          if (Math.max(moveDistanceX, moveDistanceY) < dragStartThresholdPx) {
            return
          }

          dragContext.hasStartedDragging = true
          moveEvent.preventDefault()
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
          const initialSlotIndex = Math.max(
            0,
            sortedWorkspaceModules.findIndex(
              (workspaceModule) => workspaceModule.id === moduleId
            )
          )

          startModuleDrag(
            moduleId,
            nextDraggedModuleFrame,
            initialSlotIndex
          )
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

      const finalizePointerDrag = async (
        pointerEvent?: globalThis.PointerEvent,
        options?: { cancel?: boolean }
      ) => {
        const dragContext = pointerDragContextRef.current

        pointerDragContextRef.current = null
        detachPointerDragListeners()
        stopDragAutoScroll()

        if (options?.cancel) {
          if (pointerEvent) {
            pointerEvent.preventDefault()
          }

          await commitModuleDrop(null, null)
          return
        }

        await commitModuleDrop(
          dragContext?.hasStartedDragging ? dragContext.moduleId : null,
          moduleDropSlotIndexRef.current
        )
      }

      const handlePointerUp = async (upEvent: globalThis.PointerEvent) => {
        pointerPositionRef.current = {
          x: upEvent.clientX,
          y: upEvent.clientY,
        }
        updateDraggedModuleVisualPosition(moduleId)
        await finalizePointerDrag(upEvent)
      }

      const handlePointerCancel = async (cancelEvent: globalThis.PointerEvent) => {
        await finalizePointerDrag(cancelEvent, { cancel: true })
      }

      pointerDragListenersRef.current = {
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
      detachPointerDragListeners,
      getModuleDropSlotIndexFromPointer,
      isDragDisabled,
      sortedWorkspaceModules,
      startModuleDrag,
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
    },
    [draggedModuleId]
  )

  const handleDraggedModuleOverlayRefChange = useCallback(
    (moduleId: string, element: HTMLElement | null) => {
      if (draggedModuleId !== moduleId) {
        return
      }

      draggedOverlayElementRef.current = element

      if (!element) {
        return
      }

      updateDraggedModuleVisualPosition(moduleId)
    },
    [draggedModuleId, updateDraggedModuleVisualPosition]
  )

  useEffect(() => {
    return () => {
      restoreDocumentTextSelection()
      stopDragAutoScroll()
      detachPointerDragListeners()
    }
  }, [detachPointerDragListeners, restoreDocumentTextSelection, stopDragAutoScroll])

  return {
    activeDragSurface,
    commitModuleDrop,
    draggedModuleFrame,
    draggedModuleId,
    handleModulePointerDragStart,
    handleDraggedModuleOverlayRefChange,
    handleModuleSectionRefChange,
    moduleDropSlotIndex,
    projectedDropSurface,
    settlingModuleDrop,
    startSharedDrag,
    updateProjectedDropSurface,
  }
}
