"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/app/components/layout/AppLayout"
import { useCurrentUser } from "@/lib/use-current-user"
import { useAccountSettings } from "./use-account-settings"

export default function AccountSettingsPage() {
  const router = useRouter()
  const { currentUser, isLoading, logout } = useCurrentUser()
  const {
    changePassword,
    confirmPassword,
    currentPassword,
    displayName,
    isChangingPassword,
    isSavingProfile,
    newPassword,
    passwordError,
    passwordMessage,
    profileError,
    profileMessage,
    saveProfile,
    setConfirmPassword,
    setCurrentPassword,
    setDisplayName,
    setNewPassword,
  } = useAccountSettings(currentUser)

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login?next=/settings/account")
    }
  }, [currentUser, isLoading, router])

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
          </div>

          {profileError && (
            <p className="mt-4 text-sm font-medium text-red-600">{profileError}</p>
          )}
          {profileMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              {profileMessage}
            </p>
          )}

          <div className="mt-6 flex justify-end">
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
      </main>
    </AppLayout>
  )
}
