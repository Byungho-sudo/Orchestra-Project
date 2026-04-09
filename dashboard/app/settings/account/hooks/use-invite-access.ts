"use client"

import { useCallback, useEffect, useState } from "react"

export type InviteCodeListItem = {
  id: string
  label: string | null
  is_active: boolean
  use_count: number
  max_uses: number | null
  created_at: string
  expires_at: string | null
  guest_display_name: string | null
}

type RecentInviteCodeResult = {
  contextLabel: string
  heading: string
  rawCode: string
}

type CreateInviteCodeDraft = {
  expiresAt: string
  label: string
  maxUses: string
}

const emptyDraft: CreateInviteCodeDraft = {
  expiresAt: "",
  label: "",
  maxUses: "",
}

export function useInviteAccess() {
  const [draft, setDraft] = useState<CreateInviteCodeDraft>(emptyDraft)
  const [displayNameError, setDisplayNameError] = useState("")
  const [inviteCodes, setInviteCodes] = useState<InviteCodeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isRegeneratingId, setIsRegeneratingId] = useState<string | null>(null)
  const [updatingInviteId, setUpdatingInviteId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [recentInviteCodeResult, setRecentInviteCodeResult] =
    useState<RecentInviteCodeResult | null>(null)

  const loadInviteCodes = useCallback(async () => {
    setIsLoading(true)
    setError("")

    const response = await fetch("/api/invite-codes", {
      method: "GET",
    })
    const payload = (await response.json().catch(() => null)) as
      | { inviteCodes?: InviteCodeListItem[]; message?: string }
      | null

    setIsLoading(false)

    if (!response.ok) {
      setError(payload?.message ?? "Failed to load invite codes.")
      return
    }

    setInviteCodes(payload?.inviteCodes ?? [])
  }, [])

  useEffect(() => {
    void loadInviteCodes()
  }, [loadInviteCodes])

  const createInviteCode = useCallback(async () => {
    if (isCreating) {
      return
    }

    const trimmedDisplayName = draft.label.trim()

    setIsCreating(true)
    setDisplayNameError("")
    setError("")
    setRecentInviteCodeResult(null)

    if (!trimmedDisplayName) {
      setIsCreating(false)
      setDisplayNameError("Display name is required.")
      return
    }

    const parsedMaxUses = draft.maxUses.trim()
      ? Number(draft.maxUses.trim())
      : null

    if (parsedMaxUses !== null && (!Number.isFinite(parsedMaxUses) || parsedMaxUses <= 0)) {
      setIsCreating(false)
      setError("Max uses must be a positive number.")
      return
    }

    const response = await fetch("/api/invite-codes/create", {
      body: JSON.stringify({
        expiresAt: draft.expiresAt || null,
        label: trimmedDisplayName,
        maxUses: parsedMaxUses,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    const payload = (await response.json().catch(() => null)) as
      | {
          inviteCode?: InviteCodeListItem
          message?: string
          rawCode?: string
        }
      | null

    setIsCreating(false)

    if (!response.ok || !payload?.inviteCode || !payload.rawCode) {
      setError(payload?.message ?? "Failed to create invite code.")
      return
    }

    setInviteCodes((currentInviteCodes) => [
      payload.inviteCode as InviteCodeListItem,
      ...currentInviteCodes,
    ])
    setRecentInviteCodeResult({
      contextLabel: payload.inviteCode.label?.trim() || trimmedDisplayName,
      heading: "Invite code created",
      rawCode: payload.rawCode,
    })
    setDraft(emptyDraft)
  }, [draft, isCreating])

  const regenerateGuestAccessCode = useCallback(async (
    inviteCodeId: string
  ) => {
    if (isRegeneratingId) {
      return
    }

    setIsRegeneratingId(inviteCodeId)
    setError("")
    setRecentInviteCodeResult(null)

    const response = await fetch(
      `/api/invite-codes/${inviteCodeId}/regenerate-access-code`,
      {
        method: "POST",
      }
    )

    const payload = (await response.json().catch(() => null)) as
      | {
          inviteCode?: InviteCodeListItem
          message?: string
          rawCode?: string
        }
      | null

    setIsRegeneratingId(null)

    if (!response.ok || !payload?.inviteCode || !payload.rawCode) {
      setError(payload?.message ?? "Failed to generate a new guest access code.")
      return
    }

    setRecentInviteCodeResult({
      contextLabel:
        payload.inviteCode.guest_display_name?.trim() ||
        payload.inviteCode.label?.trim() ||
        "Guest invite",
      heading: "New guest access code generated",
      rawCode: payload.rawCode,
    })

    await loadInviteCodes()
  }, [isRegeneratingId, loadInviteCodes])

  const updateInviteCodeActivity = useCallback(async (
    inviteCodeId: string,
    nextIsActive: boolean
  ) => {
    if (updatingInviteId) {
      return
    }

    setUpdatingInviteId(inviteCodeId)
    setError("")

    const action = nextIsActive ? "reactivate" : "deactivate"
    const response = await fetch(`/api/invite-codes/${inviteCodeId}/${action}`, {
      method: "POST",
    })
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; success?: boolean }
      | null

    setUpdatingInviteId(null)

    if (!response.ok || !payload?.success) {
      setError(
        payload?.message ??
          `Failed to ${nextIsActive ? "reactivate" : "deactivate"} invite code.`
      )
      return
    }

    await loadInviteCodes()
  }, [loadInviteCodes, updatingInviteId])

  return {
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
    setRecentInviteCodeResult,
    updateInviteCodeActivity,
    updatingInviteId,
  }
}
