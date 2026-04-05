"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export function useAccountSettings(user: User | null) {
  const router = useRouter()
  const initialDisplayName = useMemo(
    () => String(user?.user_metadata?.display_name ?? ""),
    [user]
  )

  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState("")
  const [profileError, setProfileError] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    setDisplayName(initialDisplayName)
  }, [initialDisplayName])

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

  return {
    changePassword,
    confirmPassword,
    currentPassword,
    displayName,
    isChangingPassword,
    isSavingProfile,
    passwordError,
    passwordMessage,
    profileError,
    profileMessage,
    saveProfile,
    setConfirmPassword,
    setCurrentPassword,
    setDisplayName,
    setNewPassword,
    newPassword,
  }
}
