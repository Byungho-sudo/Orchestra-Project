"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/ui"

export function Modal({
  children,
  hasUnsavedChanges = false,
  isDismissDisabled = false,
  overlayClassName = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4",
  panelClassName = "w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--theme-card)] p-6 shadow-[var(--shadow-lg)]",
  onClose,
}: {
  children: (controls: { requestClose: () => void }) => ReactNode
  hasUnsavedChanges?: boolean
  isDismissDisabled?: boolean
  overlayClassName?: string
  panelClassName?: string
  onClose: () => void
}) {
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)

  function requestClose() {
    if (isDismissDisabled) return

    if (hasUnsavedChanges) {
      setIsDiscardConfirmOpen(true)
      return
    }

    onClose()
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        requestClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  })

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const { body, documentElement } = document
    const scrollY = window.scrollY
    const previousBodyOverflow = body.style.overflow
    const previousBodyPosition = body.style.position
    const previousBodyTop = body.style.top
    const previousBodyWidth = body.style.width
    const previousBodyLeft = body.style.left
    const previousBodyRight = body.style.right
    const previousOverscrollBehavior = documentElement.style.overscrollBehavior

    body.style.overflow = "hidden"
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"
    documentElement.style.overscrollBehavior = "none"

    return () => {
      body.style.overflow = previousBodyOverflow
      body.style.position = previousBodyPosition
      body.style.top = previousBodyTop
      body.style.width = previousBodyWidth
      body.style.left = previousBodyLeft
      body.style.right = previousBodyRight
      documentElement.style.overscrollBehavior = previousOverscrollBehavior
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" })
    }
  }, [])

  return (
    <div
      className={overlayClassName}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose()
        }
      }}
    >
      {isDiscardConfirmOpen ? (
        <div
          className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--theme-card)] p-6 shadow-[var(--shadow-lg)]"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-[var(--theme-card-foreground)]">
            Discard changes?
          </h3>
          <p className="mt-2 text-sm text-[var(--color-card-muted-foreground)]">
            You have unsaved changes. Discard them?
          </p>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDiscardConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={onClose}>
              Discard changes
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(panelClassName)}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {children({ requestClose })}
        </div>
      )}
    </div>
  )
}
