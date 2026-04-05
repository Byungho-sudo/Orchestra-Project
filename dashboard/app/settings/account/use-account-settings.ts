"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export function useAccountSettings(user: User | null) {
  const router = useRouter()
  const initialDisplayName = useMemo(
    () => String(user?.user_metadata?.display_name ?? ""),
    [user]
  )
  const initialEmail = useMemo(() => String(user?.email ?? ""), [user])

  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [newEmail, setNewEmail] = useState(initialEmail)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState("")
  const [profileError, setProfileError] = useState("")
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState("")
  const [emailError, setEmailError] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState("")

  useEffect(() => {
    setDisplayName(initialDisplayName)
  }, [initialDisplayName])

  useEffect(() => {
    setNewEmail(initialEmail)
  }, [initialEmail])

  useEffect(() => {
    const loadCurrentSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setCurrentSession(session)
    }

    loadCurrentSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function saveProfile() {
    if (!user || isSavingProfile) return

    const trimmedDisplayName = displayName.trim()

    setProfileError("")
    setProfileMessage("")
    setIsSavingProfile(true)

    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: trimmedDisplayName,
      },
    })

    setIsSavingProfile(false)

    if (error) {
      setProfileError("Failed to update your profile. Please try again.")
      return
    }

    setDisplayName(trimmedDisplayName)
    setProfileMessage("Profile updated successfully.")
    router.refresh()
  }

  async function updateEmail() {
    if (!user || isUpdatingEmail) return

    const trimmedEmail = newEmail.trim().toLowerCase()

    setEmailError("")
    setEmailMessage("")

    if (!trimmedEmail) {
      setEmailError("Enter a new email address.")
      return
    }

    if (trimmedEmail === initialEmail.toLowerCase()) {
      setEmailError("Enter a different email address to update it.")
      return
    }

    setIsUpdatingEmail(true)

    const { error } = await supabase.auth.updateUser(
      { email: trimmedEmail },
      {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          "/settings/account?email-change=confirmed"
        )}`,
      }
    )

    setIsUpdatingEmail(false)

    if (error) {
      setEmailError("Failed to start the email change flow. Please try again.")
      return
    }

    setEmailMessage(
      "Check your inbox to confirm the new email address and complete the change."
    )
  }

  async function changePassword() {
    if (!user || isChangingPassword) return

    const trimmedCurrentPassword = currentPassword.trim()

    setPasswordError("")
    setPasswordMessage("")

    if (!trimmedCurrentPassword || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError("Fill in all password fields.")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation must match.")
      return
    }

    setIsChangingPassword(true)

    // Supabase does not expose a dedicated in-session current-password verify call,
    // so this MVP reauthenticates with the current credentials before updating.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email ?? "",
      password: trimmedCurrentPassword,
    })

    if (verifyError) {
      setIsChangingPassword(false)
      setPasswordError("Current password is incorrect.")
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setIsChangingPassword(false)

    if (updateError) {
      setPasswordError("Failed to update your password. Please try again.")
      return
    }

    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordMessage("Password updated successfully.")
  }

  async function deleteAccount() {
    if (!user || isDeletingAccount) return false

    setDeleteAccountError("")

    if (deleteConfirmation.trim() !== "DELETE") {
      setDeleteAccountError('Type "DELETE" to confirm account deletion.')
      return false
    }

    setIsDeletingAccount(true)

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
      })

      const result = (await response.json().catch(() => null)) as
        | { error?: string; success?: boolean }
        | null

      if (!response.ok || !result?.success) {
        setDeleteAccountError(
          result?.error ?? "Failed to delete your account. Please try again."
        )
        return false
      }

      await supabase.auth.signOut()
      return true
    } catch {
      setDeleteAccountError(
        "Failed to delete your account. Please try again."
      )
      return false
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return {
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
    isUpdatingEmail,
    newEmail,
    passwordError,
    passwordMessage,
    profileError,
    profileMessage,
    saveProfile,
    setConfirmPassword,
    setCurrentPassword,
    setDeleteConfirmation,
    setDisplayName,
    setNewEmail,
    setNewPassword,
    updateEmail,
    newPassword,
  }
}
