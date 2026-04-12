"use client"

import { useEffect, useMemo, useRef, useState } from "react"

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function parseDateInputValue(value: string | null) {
  if (!value) return null

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) return null

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const parsedDate = new Date(year, monthIndex, day)

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== monthIndex ||
    parsedDate.getDate() !== day
  ) {
    return null
  }

  parsedDate.setHours(0, 0, 0, 0)
  return parsedDate
}

function createRelativeDate(daysFromToday: number) {
  const nextDate = new Date()
  nextDate.setHours(0, 0, 0, 0)
  nextDate.setDate(nextDate.getDate() + daysFromToday)
  return formatDateInputValue(nextDate)
}

function formatDueDateLabel(value: string | null) {
  const parsedDate = parseDateInputValue(value)

  if (!parsedDate) {
    return ""
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const differenceInDays = Math.round(
    (parsedDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  )

  if (differenceInDays === 0) return "Due today"
  if (differenceInDays === 1) return "Due tomorrow"
  if (differenceInDays > 1 && differenceInDays <= 7) {
    return `Due in ${differenceInDays} days`
  }
  if (differenceInDays === -1) return "Overdue by 1 day"
  if (differenceInDays < -1) return `Overdue by ${Math.abs(differenceInDays)} days`

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate)
}

function getDueDateToneClassName({
  completed,
  dueDate,
}: {
  completed?: boolean
  dueDate: string | null
}) {
  if (completed) {
    return "border-slate-200 bg-slate-100 text-slate-400"
  }

  const parsedDate = parseDateInputValue(dueDate)

  if (!parsedDate) {
    return "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const differenceInDays = Math.round(
    (parsedDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  )

  if (differenceInDays < 0) {
    return "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
  }

  if (differenceInDays <= 1) {
    return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
  }

  return "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
}

export function ChecklistDueDate({
  completed = false,
  disabled = false,
  dueDate,
  emptyLabel = "Set due date",
  onChange,
}: {
  completed?: boolean
  disabled?: boolean
  dueDate: string | null
  emptyLabel?: string
  onChange: (value: string) => void
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPickingCustomDate, setIsPickingCustomDate] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const dateInputRef = useRef<HTMLInputElement | null>(null)

  const label = useMemo(
    () => formatDueDateLabel(dueDate) || emptyLabel,
    [dueDate, emptyLabel]
  )

  useEffect(() => {
    if (!isMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false)
        setIsPickingCustomDate(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false)
        setIsPickingCustomDate(false)
      }
    }

    window.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (!isMenuOpen || !isPickingCustomDate) return

    const focusTimeout = setTimeout(() => {
      dateInputRef.current?.focus()
    }, 0)

    return () => {
      clearTimeout(focusTimeout)
    }
  }, [isMenuOpen, isPickingCustomDate])

  function applyDueDate(nextValue: string | null) {
    onChange(nextValue ?? "")
    setIsMenuOpen(false)
    setIsPickingCustomDate(false)
  }

  return (
    <div
      ref={menuRef}
      className="relative"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsMenuOpen((current) => !current)
          setIsPickingCustomDate(false)
        }}
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${getDueDateToneClassName(
          {
            completed,
            dueDate,
          }
        )}`}
      >
        {label}
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {!isPickingCustomDate ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => applyDueDate(createRelativeDate(0))}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyDueDate(createRelativeDate(1))}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => applyDueDate(createRelativeDate(3))}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                In 3 days
              </button>
              <button
                type="button"
                onClick={() => applyDueDate(createRelativeDate(7))}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                In 1 week
              </button>
              <button
                type="button"
                onClick={() => setIsPickingCustomDate(true)}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Pick date...
              </button>
              <button
                type="button"
                onClick={() => applyDueDate(null)}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pick date
              </label>
              <input
                ref={dateInputRef}
                type="date"
                value={dueDate ?? ""}
                onChange={(event) => {
                  if (!event.target.value) return
                  applyDueDate(event.target.value)
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPickingCustomDate(false)}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
