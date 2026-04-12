"use client"

import { useEffect, useRef, useState } from "react"

export function GuestSettingsMenu({
  currentDisplayName,
  onSaved,
}: {
  currentDisplayName: string
  onSaved: (displayName: string) => void
}) {
  const [accessCode, setAccessCode] = useState("")
  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [error, setError] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDisplayName(currentDisplayName)
  }, [currentDisplayName])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  async function handleSave() {
    if (isSaving) {
      return
    }

    setError("")
    setSuccessMessage("")
    setIsSaving(true)

    try {
      const response = await fetch("/api/guest/update-credentials", {
        body: JSON.stringify({
          accessCode,
          displayName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      })

      const result = (await response.json().catch(() => null)) as
        | { displayName?: string; message?: string; success?: boolean }
        | null

      if (!response.ok || !result?.success) {
        setError(
          result?.message ??
            "Guest settings could not be updated. Please try again."
        )
        return
      }

      const nextDisplayName = result.displayName ?? displayName.trim()
      setDisplayName(nextDisplayName)
      setAccessCode("")
      setSuccessMessage("Guest settings saved.")
      onSaved(nextDisplayName)
    } catch {
      setError("Guest settings could not be updated. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((current) => !current)}
        className="max-w-[180px] truncate rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
      >
        {currentDisplayName}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Guest Settings
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Update your public name and the access code you use to come back.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How your name appears in Orchestra"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Access Code
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                placeholder="Leave blank to keep the current code"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2"
              />
            </div>

            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : null}

            {successMessage ? (
              <p className="text-sm font-medium text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
