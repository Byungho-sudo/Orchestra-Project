"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useCurrentUser } from "@/lib/use-current-user"
import { useAppActor } from "@/lib/auth/use-app-actor"

type GuestStep = "code" | "profile"

export function GuestAccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser, isLoading: isAuthLoading } = useCurrentUser()
  const { actor, isLoading: isActorLoading } = useAppActor(currentUser)
  const [step, setStep] = useState<GuestStep>("code")
  const [inviteCode, setInviteCode] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasCreatedAnonymousSession, setHasCreatedAnonymousSession] =
    useState(false)

  useEffect(() => {
    if (isAuthLoading || isActorLoading) {
      return
    }

    if (actor?.kind === "guest" || actor?.kind === "user") {
      router.replace("/projects")
      return
    }

    if (
      currentUser?.is_anonymous &&
      !actor &&
      !isSubmitting &&
      !hasCreatedAnonymousSession
    ) {
      void supabase.auth.signOut()
    }
  }, [
    actor,
    currentUser,
    hasCreatedAnonymousSession,
    isActorLoading,
    isAuthLoading,
    isSubmitting,
    router,
  ])

  async function handleValidateInviteCode() {
    if (!inviteCode.trim() || isValidating) {
      return
    }

    setIsValidating(true)
    setError("")

    const response = await fetch("/api/guest/validate-invite", {
      body: JSON.stringify({ code: inviteCode }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; valid?: boolean }
      | null

    setIsValidating(false)

    if (!payload?.valid) {
      setError(payload?.message ?? "That invite code is not available.")
      return
    }

    setStep("profile")
  }

  async function handleCreateGuestSession() {
    if (!inviteCode.trim() || !displayName.trim() || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError("")

    const alreadySignedIn = Boolean(currentUser)

    if (!alreadySignedIn) {
      const { error: anonymousAuthError } = await supabase.auth.signInAnonymously()

      if (anonymousAuthError) {
        setIsSubmitting(false)
        setError("Guest access could not be started. Please try again.")
        return
      }

      setHasCreatedAnonymousSession(true)
    }

    const response = await fetch("/api/guest/bootstrap", {
      body: JSON.stringify({
        code: inviteCode,
        displayName,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; redirectTo?: string }
      | null

    if (!response.ok) {
      if (hasCreatedAnonymousSession || !alreadySignedIn) {
        await supabase.auth.signOut()
      }

      setIsSubmitting(false)
      setHasCreatedAnonymousSession(false)
      setError(payload?.message ?? "Guest access could not be created.")
      return
    }

    router.replace(payload?.redirectTo ?? "/projects")
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Guest Access
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Enter Orchestra with an invite code
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use a valid invite code to start a lightweight guest session and work
          on your own projects without creating a full account.
        </p>

        {searchParams.get("revoked") === "1" ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            This guest session has been revoked. Enter a new invite code to
            continue.
          </p>
        ) : null}

        {step === "code" ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="Paste or type your invite code"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleValidateInviteCode()}
              disabled={!inviteCode.trim() || isValidating}
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isValidating ? "Checking..." : "Continue"}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Invite code accepted.
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How should Orchestra refer to you?"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setError("")
                  setStep("code")
                }}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void handleCreateGuestSession()}
                disabled={!displayName.trim() || isSubmitting}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Starting session..." : "Enter Orchestra"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600">
          Returning guest? Re-enter your invite code and display name.
        </div>
      </div>
    </main>
  )
}
