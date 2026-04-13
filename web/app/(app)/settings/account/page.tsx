"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/AppLayout"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { useCurrentUser } from "@/lib/use-current-user"
import { InviteAccessSection } from "./components/InviteAccessSection"
import { useAccountSettings } from "./use-account-settings"

export default function AccountSettingsPage() {
  return (
    <Suspense>
      <AccountSettingsPageContent />
    </Suspense>
  )
}

function formatIsoDateTime(value?: string | null) {
  if (!value) return "Unavailable"

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unavailable"
  }

  return parsedDate.toISOString()
}

function formatUnixTimestamp(seconds?: number | null) {
  if (!seconds) return "Unavailable"

  const parsedDate = new Date(seconds * 1000)

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unavailable"
  }

  return parsedDate.toISOString()
}

function AccountSettingsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser, isLoading, logout } = useCurrentUser()
  const {
    changePassword,
    confirmPassword,
    currentSession,
    currentPassword,
    deleteAccount,
    deleteAccountError,
    deleteConfirmation,
    displayName,
    emailError,
    emailMessage,
    isChangingPassword,
    isDeletingAccount,
    isSavingProfile,
    isSavingTheme,
    isUpdatingEmail,
    newEmail,
    newPassword,
    passwordError,
    passwordMessage,
    profileError,
    profileMessage,
    saveProfile,
    saveTheme,
    setConfirmPassword,
    setCurrentPassword,
    setDeleteConfirmation,
    setDisplayName,
    setNewEmail,
    setNewPassword,
    setThemeFamily,
    themeError,
    themeFamily,
    themeMessage,
    updateEmail,
  } = useAccountSettings(currentUser)
  const emailChangeConfirmed =
    searchParams.get("email-change") === "confirmed"

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login?next=/settings/account")
    }
  }, [currentUser, isLoading, router])

  async function handleDeleteAccount() {
    const wasDeleted = await deleteAccount()

    if (!wasDeleted) return

    router.replace("/login?account-deleted=success")
  }

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
        <Card as="section" padding="lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-card-muted-foreground)]">
            Account Settings
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--theme-card-foreground)]">
            Manage your account
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-card-muted-foreground)]">
            Update your profile, email, and core security settings.
          </p>
        </Card>

        <Card as="section" padding="lg">
          <h2 className="text-xl font-semibold text-[var(--theme-card-foreground)]">Profile</h2>
          <div className="mt-6 grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
                Current Email
              </label>
              <Input
                type="email"
                value={currentUser?.email ?? ""}
                disabled
                className="bg-[var(--color-background)] text-[var(--color-card-muted-foreground)] shadow-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
                Display Name
              </label>
              <Input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How your name should appear"
                className="shadow-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
                Change Email
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="Enter a new email address"
                className="shadow-none"
              />
              <p className="mt-2 text-xs text-[var(--color-card-muted-foreground)]">
                We will send a confirmation link to complete the email change.
              </p>
            </div>
          </div>

          {profileError && (
            <p className="mt-4 text-sm font-medium text-[var(--color-status-danger)]">
              {profileError}
            </p>
          )}
          {profileMessage && (
            <p className="mt-4 text-sm font-medium text-[var(--color-status-success)]">
              {profileMessage}
            </p>
          )}
          {emailChangeConfirmed && (
            <p className="mt-4 text-sm font-medium text-[var(--color-status-success)]">
              Your email change was confirmed successfully.
            </p>
          )}
          {emailError && (
            <p className="mt-4 text-sm font-medium text-[var(--color-status-danger)]">
              {emailError}
            </p>
          )}
          {emailMessage && (
            <p className="mt-4 text-sm font-medium text-[var(--color-status-success)]">
              {emailMessage}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={updateEmail}
              disabled={isLoading || isUpdatingEmail}
              className="shadow-none"
            >
              {isUpdatingEmail ? "Sending..." : "Update Email"}
            </Button>
            <Button
              type="button"
              onClick={saveProfile}
              disabled={isLoading || isSavingProfile}
            >
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Card>

        <Card as="section" padding="lg">
          <h2 className="text-xl font-semibold text-[var(--theme-card-foreground)]">Security</h2>
          <div className="mt-6 grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="shadow-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
                New Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="shadow-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="shadow-none"
              />
            </div>
          </div>

          {passwordError && (
            <p className="mt-4 text-sm font-medium text-[var(--color-status-danger)]">
              {passwordError}
            </p>
          )}
          {passwordMessage && (
            <p className="mt-4 text-sm font-medium text-[var(--color-status-success)]">
              {passwordMessage}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={changePassword}
              disabled={isLoading || isChangingPassword}
            >
              {isChangingPassword ? "Updating..." : "Change Password"}
            </Button>
          </div>
        </Card>

        <Card as="section" padding="lg">
          <h2 className="text-xl font-semibold text-[var(--theme-card-foreground)]">Theme</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-card-muted-foreground)]">
            Choose which theme family the app uses for your account.
          </p>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
                Theme Family
              </label>
              <Select
                value={themeFamily}
                onChange={(event) =>
                  setThemeFamily(event.target.value as "default" | "terra")
                }
                className="text-[var(--theme-card-foreground)] shadow-none"
              >
                <option value="default">default</option>
                <option value="terra">terra</option>
              </Select>
              <p className="mt-2 text-xs text-[var(--color-card-muted-foreground)]">
                Terra currently uses the available dark Terra mode. Terra light is
                not exposed yet.
              </p>
            </div>
          </div>

          {themeError && (
            <p className="mt-4 text-sm font-medium text-[var(--color-status-danger)]">
              {themeError}
            </p>
          )}
          {themeMessage && (
            <p className="mt-4 text-sm font-medium text-[var(--color-status-success)]">
              {themeMessage}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={saveTheme}
              disabled={isLoading || isSavingTheme}
            >
              {isSavingTheme ? "Saving..." : "Save Theme"}
            </Button>
          </div>
        </Card>

        <Card as="section" padding="lg">
          <h2 className="text-xl font-semibold text-[var(--theme-card-foreground)]">Sessions</h2>
          <div className="mt-6 grid gap-4">
            <Card as="div" padding="sm" className="bg-[var(--color-background)] shadow-none">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-card-muted-foreground)]">
                Current Session
              </p>
              <div className="mt-3 space-y-2 text-sm text-[var(--color-card-muted-foreground)]">
                <p>
                  <span className="font-medium text-[var(--theme-card-foreground)]">User ID:</span>{" "}
                  {currentUser?.id ?? "Unavailable"}
                </p>
                <p>
                  <span className="font-medium text-[var(--theme-card-foreground)]">Last Sign In:</span>{" "}
                  {formatIsoDateTime(currentUser?.last_sign_in_at)}
                </p>
                <p>
                  <span className="font-medium text-[var(--theme-card-foreground)]">Auth Status:</span>{" "}
                  {currentSession ? "Authenticated" : "No active session"}
                </p>
                <p>
                  <span className="font-medium text-[var(--theme-card-foreground)]">Session Expires:</span>{" "}
                  {formatUnixTimestamp(currentSession?.expires_at)}
                </p>
              </div>
            </Card>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={logout}
              variant="secondary"
              className="shadow-none"
            >
              Sign Out
            </Button>
          </div>
        </Card>

        <InviteAccessSection />

        <Card
          as="section"
          padding="lg"
          className="border-[var(--color-status-danger-border)]"
        >
          <h2 className="text-xl font-semibold text-[var(--color-status-danger)]">Danger Zone</h2>
          <div className="mt-6 rounded-lg border border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-soft)] p-4">
            <p className="text-sm font-medium text-[var(--color-status-danger)]">Delete account</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-status-danger)]">
              This permanently deletes your account and removes access to the
              app. This action cannot be undone.
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-[var(--color-status-danger)]">
                Type DELETE to confirm
              </label>
              <Input
                type="text"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="DELETE"
                className="border-[var(--color-status-danger-border)] bg-[var(--theme-card)] text-[var(--theme-card-foreground)] shadow-none focus:ring-[var(--color-status-danger)]"
              />
            </div>
            {deleteAccountError && (
              <p className="mt-4 text-sm font-medium text-[var(--color-status-danger)]">
                {deleteAccountError}
              </p>
            )}
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={
                  isLoading ||
                  isDeletingAccount ||
                  deleteConfirmation.trim() !== "DELETE"
                }
              >
                {isDeletingAccount ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </AppLayout>
  )
}
