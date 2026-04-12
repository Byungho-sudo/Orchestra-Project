"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export function useCurrentUser() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setCurrentUser(user)
      setIsLoading(false)
    }

    loadCurrentUser()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    router.push("/login")
  }

  return { currentUser, isLoading, logout }
}
