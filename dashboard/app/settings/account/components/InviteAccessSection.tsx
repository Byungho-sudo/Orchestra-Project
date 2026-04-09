"use client"

import { useEffect, useMemo, useState } from "react"
import { useInviteAccess } from "../hooks/use-invite-access"

const existingInvitesStorageKey = "orchestra-invite-access-existing-invites-open"

function formatInviteTimestamp(value: string | null) {
  if (!value) {
    return "None"
  }

  const parsedValue = new Date(value)

  if (Number.isNaN(parsedValue.getTime())) {
    return "Unavailable"
  }

  return parsedValue.toISOString()
}

export function InviteAccessSection() {
  const {
    createInviteCode,
    displayNameError,
    draft,
    error,
    isRegeneratingId,
    inviteCodes,
    isCreating,
    isLoading,
    recentInviteCodeResult,
    regenerateGuestAccessCode,
    setDraft,
    updateInviteCodeActivity,
    updatingInviteId,
  } = useInviteAccess()
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")
  const [isExistingInvitesOpen, setIsExistingInvitesOpen] = useState(false)
  const [isExpiresAtFocused, setIsExpiresAtFocused] = useState(false)

  const sortedInviteCodes = useMemo(
    () =>
      [...inviteCodes].sort((firstInvite, secondInvite) =>
        secondInvite.created_at.localeCompare(firstInvite.created_at)
      ),
    [inviteCodes]
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const storedValue = window.sessionStorage.getItem(existingInvitesStorageKey)
    setIsExistingInvitesOpen(storedValue === "open")
  }, [])

  async function handleCopyRawCode() {
    if (!recentInviteCodeResult?.rawCode) {
      return
    }

    await navigator.clipboard.writeText(recentInviteCodeResult.rawCode)
    setCopyState("copied")

    window.setTimeout(() => setCopyState("idle"), 1500)
  }

  function toggleExistingInvites() {
    setIsExistingInvitesOpen((current) => {
      const nextValue = !current

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          existingInvitesStorageKey,
          nextValue ? "open" : "closed"
        )
      }

      return nextValue
    })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Invite Access</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Create and manage guest invite codes.
      </p>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Display Name
          </label>
          <input
            type="text"
            value={draft.label}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                label: event.target.value,
              }))
            }
            placeholder="Enter display name for this guest"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2"
          />
          {displayNameError ? (
            <p className="mt-2 text-sm font-medium text-red-600">
              {displayNameError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Max Uses
            </label>
            <input
              type="number"
              min={1}
              value={draft.maxUses}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  maxUses: event.target.value,
                }))
              }
              placeholder="Unlimited if empty"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Expires At
            </label>
            <input
              type={isExpiresAtFocused || draft.expiresAt ? "datetime-local" : "text"}
              value={draft.expiresAt}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  expiresAt: event.target.value,
                }))
              }
              onFocus={() => setIsExpiresAtFocused(true)}
              onBlur={() => setIsExpiresAtFocused(false)}
              placeholder="Does not expire if left empty"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2"
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => void createInviteCode()}
          disabled={isCreating || !draft.label.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? "Creating..." : "Create Invite Code"}
        </button>
      </div>

      {recentInviteCodeResult ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            {recentInviteCodeResult.heading}
          </p>
          <p className="mt-2 text-sm text-emerald-800">
            {recentInviteCodeResult.contextLabel}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm">
              {recentInviteCodeResult.rawCode}
            </code>
            <button
              type="button"
              onClick={() => void handleCopyRawCode()}
              className="rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-3 text-sm text-emerald-800">
            Copy this now. It will not be shown again.
          </p>
        </div>
      ) : null}

      <div className="mt-8 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Existing Invites</h3>
          <button
            type="button"
            aria-expanded={isExistingInvitesOpen}
            onClick={toggleExistingInvites}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50"
          >
            <span
              aria-hidden="true"
              className={`text-base transition-transform ${
                isExistingInvitesOpen ? "rotate-90" : "rotate-0"
              }`}
            >
              &gt;
            </span>
          </button>
        </div>

        {isExistingInvitesOpen ? (
          isLoading ? (
            <p className="mt-4 text-sm text-slate-500">Loading invite codes...</p>
          ) : sortedInviteCodes.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No invite codes created yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {sortedInviteCodes.map((inviteCode) => (
                <article
                  key={inviteCode.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {inviteCode.guest_display_name?.trim() ||
                            inviteCode.label?.trim()}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            inviteCode.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {inviteCode.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p>
                        <span className="font-medium text-slate-900">Uses:</span>{" "}
                        {inviteCode.use_count}
                        {inviteCode.max_uses !== null
                          ? ` / ${inviteCode.max_uses}`
                          : " / Unlimited"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Created:</span>{" "}
                        {formatInviteTimestamp(inviteCode.created_at)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Expires:</span>{" "}
                        {formatInviteTimestamp(inviteCode.expires_at)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {inviteCode.guest_display_name ? (
                        <button
                          type="button"
                          onClick={() => void regenerateGuestAccessCode(inviteCode.id)}
                          disabled={isRegeneratingId === inviteCode.id}
                          className="rounded-md border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isRegeneratingId === inviteCode.id
                            ? "Generating..."
                            : "Generate New Access Code"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          void updateInviteCodeActivity(
                            inviteCode.id,
                            !inviteCode.is_active
                          )
                        }
                        disabled={updatingInviteId === inviteCode.id}
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingInviteId === inviteCode.id
                          ? inviteCode.is_active
                            ? "Deactivating..."
                            : "Reactivating..."
                          : inviteCode.is_active
                            ? "Deactivate"
                            : "Reactivate"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : null}
      </div>
    </section>
  )
}
