"use client"

import Link from "next/link"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function sendResetEmail() {
    if (!email.trim() || isSending) return

    setError("")
    setMessage("")
    setIsSending(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    )

    setIsSending(false)

    if (resetError) {
      setError("Failed to send reset email. Please try again.")
      return
    }

    setMessage("Password reset email sent. Check your inbox for the recovery link.")
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email and we will send you a password reset link.
        </p>

        <div className="mt-6 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
        </div>

        {message && (
          <p className="mt-4 text-sm font-medium text-green-700">{message}</p>
        )}

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:underline">
            Back to log in
          </Link>
          <button
            type="button"
            onClick={sendResetEmail}
            disabled={!email.trim() || isSending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Sending..." : "Send reset link"}
          </button>
        </div>
      </div>
    </main>
  )
}
