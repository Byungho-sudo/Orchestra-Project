"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecoveryReady, setIsRecoveryReady] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const establishRecoverySession = async () => {
      const code = searchParams.get("code")
      const searchType = searchParams.get("type")
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const hashType = hashParams.get("type")
      const isRecoveryLink = Boolean(code) || searchType === "recovery" || hashType === "recovery"

      if (!isRecoveryLink) {
        setError("This password reset link is invalid or has expired.")
        return
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          code
        )

        if (exchangeError) {
          setError("This password reset link is invalid or has expired.")
          return
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      setIsRecoveryReady(Boolean(session))
      if (!session) {
        setError("This password reset link is invalid or has expired.")
      }
    }

    establishRecoverySession()
  }, [searchParams])

  async function handleResetPassword() {
    setError("")

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Enter and confirm your new password.")
      return
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation must match.")
      return
    }

    setIsSubmitting(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setIsSubmitting(false)

    if (updateError) {
      setError("Failed to reset your password. Please try again.")
      return
    }

    router.replace("/login?reset=success")
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose a new password for your Orchestra Project account.
        </p>

        <div className="mt-6 space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:underline">
            Back to log in
          </Link>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={!isRecoveryReady || isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Reset password"}
          </button>
        </div>
      </div>
    </main>
  )
}
