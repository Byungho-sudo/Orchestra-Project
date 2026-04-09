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
  const [inviteCodes, setInviteCodes] = useState<InviteCodeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingInviteId, setUpdatingInviteId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [recentRawCode, setRecentRawCode] = useState<string | null>(null)

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

    setIsCreating(true)
    setError("")
    setRecentRawCode(null)

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
        label: draft.label || null,
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
    setRecentRawCode(payload.rawCode)
    setDraft(emptyDraft)
  }, [draft, isCreating])

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
    draft,
    error,
    inviteCodes,
    isCreating,
    isLoading,
    recentRawCode,
    setDraft,
    setRecentRawCode,
    updateInviteCodeActivity,
    updatingInviteId,
  }
}
