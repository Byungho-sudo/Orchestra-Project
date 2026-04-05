"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/app/components/layout/AppLayout"
import { useCurrentUser } from "@/lib/use-current-user"
import { useAccountSettings } from "./use-account-settings"

export default function AccountSettingsPage() {
  const router = useRouter()
  const { currentUser, isLoading, logout } = useCurrentUser()
  const [emailChangeConfirmed, setEmailChangeConfirmed] = useState(false)
  const {
    changePassword,
    confirmPassword,
    currentSession,
    currentPassword,
    displayName,
    emailError,
    emailMessage,
    isChangingPassword,
    isSavingProfile,
    isUpdatingEmail,
    newEmail,
    newPassword,
    passwordError,
    passwordMessage,
    profileError,
    profileMessage,
    saveProfile,
    setConfirmPassword,
    setCurrentPassword,
    setDisplayName,
    setNewEmail,
    setNewPassword,
    updateEmail,
  } = useAccountSettings(currentUser)
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login?next=/settings/account")
    }
  }, [currentUser, isLoading, router])

  useEffect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    setEmailChangeConfirmed(params.get("email-change") === "confirmed")
  }, [])

  return (
    <AppLayout
      breadcrumb={{
        current: "Account",
        href: "/dashboard",
        label: "Settings",
      }}
      title="Account Settings"
      currentUser={currentUser}
      onLogout={logout}
    >
      <main className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Account Settings
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Manage your account
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Update your display name and keep your login details secure.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
          <div className="mt-6 grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={currentUser?.email ?? ""}
                disabled
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How your name should appear"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Change Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="Enter a new email address"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2"
              />
              <p className="mt-2 text-xs text-slate-500">
                We will send a confirmation link to complete the email change.
              </p>
            </div>
          </div>

          {profileError && (
            <p className="mt-4 text-sm font-medium text-red-600">{profileError}</p>
          )}
          {profileMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              {profileMessage}
            </p>
          )}
          {emailChangeConfirmed && (
            <p className="mt-4 text-sm font-medium text-green-700">
              Your email change was confirmed successfully.
            </p>
          )}
          {emailError && (
            <p className="mt-4 text-sm font-medium text-red-600">{emailError}</p>
          )}
          {emailMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              {emailMessage}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={updateEmail}
              disabled={isLoading || isUpdatingEmail}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingEmail ? "Sending..." : "Update Email"}
            </button>
            <button
              type="button"
              onClick={saveProfile}
              disabled={isLoading || isSavingProfile}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Security</h2>
          <div className="mt-6 grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2"
              />
            </div>
          </div>

          {passwordError && (
            <p className="mt-4 text-sm font-medium text-red-600">{passwordError}</p>
          )}
          {passwordMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              {passwordMessage}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={changePassword}
              disabled={isLoading || isChangingPassword}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChangingPassword ? "Updating..." : "Change Password"}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Sessions</h2>
          <div className="mt-6 grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current Session
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">User ID:</span>{" "}
                  {currentUser?.id ?? "Unavailable"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Last Sign In:</span>{" "}
                  {currentUser?.last_sign_in_at
                    ? new Date(currentUser.last_sign_in_at).toLocaleString()
                    : "Unavailable"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Auth Status:</span>{" "}
                  {currentSession ? "Authenticated" : "No active session"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Session Expires:</span>{" "}
                  {currentSession?.expires_at
                    ? new Date(currentSession.expires_at * 1000).toLocaleString()
                    : "Unavailable"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        </section>
      </main>
    </AppLayout>
  )
}
