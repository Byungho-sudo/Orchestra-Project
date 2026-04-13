"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
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
    <Card as="section" padding="lg">
      <h2 className="text-xl font-semibold text-[var(--theme-card-foreground)]">Invite Access</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-card-muted-foreground)]">
        Create and manage guest invite codes.
      </p>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
            Display Name
          </label>
          <Input
            type="text"
            value={draft.label}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                label: event.target.value,
              }))
            }
            placeholder="Enter display name for this guest"
            className="shadow-none"
          />
          {displayNameError ? (
            <p className="mt-2 text-sm font-medium text-[var(--color-status-danger)]">
              {displayNameError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
              Max Uses
            </label>
            <Input
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
              className="shadow-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
              Expires At
            </label>
            <Input
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
              className="shadow-none"
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-medium text-[var(--color-status-danger)]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={() => void createInviteCode()}
          disabled={isCreating || !draft.label.trim()}
        >
          {isCreating ? "Creating..." : "Create Invite Code"}
        </Button>
      </div>

      {recentInviteCodeResult ? (
        <div className="mt-6 rounded-lg border border-[var(--color-status-success-border)] bg-[var(--color-status-success-soft)] p-4">
          <p className="text-sm font-semibold text-[var(--color-status-success)]">
            {recentInviteCodeResult.heading}
          </p>
          <p className="mt-2 text-sm text-[var(--color-status-success)]">
            {recentInviteCodeResult.contextLabel}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="rounded-md bg-[var(--theme-card)] px-3 py-2 text-sm font-semibold text-[var(--theme-card-foreground)] shadow-[var(--color-card-shadow)]">
              {recentInviteCodeResult.rawCode}
            </code>
            <Button
              type="button"
              onClick={() => void handleCopyRawCode()}
              variant="secondary"
              className="border-[var(--color-status-success-border)] bg-[var(--theme-card)] text-[var(--color-status-success)] hover:bg-[var(--color-status-success-soft)]"
            >
              {copyState === "copied" ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-3 text-sm text-[var(--color-status-success)]">
            Copy this now. It will not be shown again.
          </p>
        </div>
      ) : null}

      <div className="mt-8 border-t border-[var(--color-card-separator)] pt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--theme-card-foreground)]">Existing Invites</h3>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-expanded={isExistingInvitesOpen}
            onClick={toggleExistingInvites}
            className="h-9 w-9"
          >
            <span
              aria-hidden="true"
              className={`text-base transition-transform ${
                isExistingInvitesOpen ? "rotate-90" : "rotate-0"
              }`}
            >
              &gt;
            </span>
          </Button>
        </div>

        {isExistingInvitesOpen ? (
          isLoading ? (
            <p className="mt-4 text-sm text-[var(--color-card-muted-foreground)]">Loading invite codes...</p>
          ) : sortedInviteCodes.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-card-muted-foreground)]">
              No invite codes created yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {sortedInviteCodes.map((inviteCode) => (
                <Card
                  as="article"
                  padding="sm"
                  key={inviteCode.id}
                  className="bg-[var(--color-background)] shadow-none"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 text-sm text-[var(--color-card-muted-foreground)]">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[var(--theme-card-foreground)]">
                          {inviteCode.guest_display_name?.trim() ||
                            inviteCode.label?.trim()}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            inviteCode.is_active
                              ? "border border-[var(--color-status-success-border)] bg-[var(--color-status-success-soft)] text-[var(--color-status-success)]"
                              : "border border-[var(--color-status-neutral-border)] bg-[var(--color-status-neutral-soft)] text-[var(--color-status-neutral)]"
                          }`}
                        >
                          {inviteCode.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p>
                        <span className="font-medium text-[var(--theme-card-foreground)]">Uses:</span>{" "}
                        {inviteCode.use_count}
                        {inviteCode.max_uses !== null
                          ? ` / ${inviteCode.max_uses}`
                          : " / Unlimited"}
                      </p>
                      <p>
                        <span className="font-medium text-[var(--theme-card-foreground)]">Created:</span>{" "}
                        {formatInviteTimestamp(inviteCode.created_at)}
                      </p>
                      <p>
                        <span className="font-medium text-[var(--theme-card-foreground)]">Expires:</span>{" "}
                        {formatInviteTimestamp(inviteCode.expires_at)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {inviteCode.guest_display_name ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void regenerateGuestAccessCode(inviteCode.id)}
                          disabled={isRegeneratingId === inviteCode.id}
                          className="border-[var(--color-accent-border)] text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
                        >
                          {isRegeneratingId === inviteCode.id
                            ? "Generating..."
                            : "Generate New Access Code"}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          void updateInviteCodeActivity(
                            inviteCode.id,
                            !inviteCode.is_active
                          )
                        }
                        disabled={updatingInviteId === inviteCode.id}
                        className="shadow-none"
                      >
                        {updatingInviteId === inviteCode.id
                          ? inviteCode.is_active
                            ? "Deactivating..."
                            : "Reactivating..."
                          : inviteCode.is_active
                            ? "Deactivate"
                            : "Reactivate"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : null}
      </div>
    </Card>
  )
}
