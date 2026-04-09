"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { AppActor, GuestUserRecord } from "./actor-types"

export function useAppActor(currentUser: User | null) {
  const [actor, setActor] = useState<AppActor | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(currentUser))

  useEffect(() => {
    let isCancelled = false

    async function loadActor() {
      if (!currentUser) {
        setActor(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      const { data: guestUser, error } = await supabase
        .from("guest_users")
        .select(
          "id,auth_user_id,invite_code_id,display_name,status,created_at,updated_at,last_seen_at"
        )
        .eq("auth_user_id", currentUser.id)
        .maybeSingle<GuestUserRecord>()

      if (isCancelled) {
        return
      }

      if (guestUser && guestUser.status === "active") {
        setActor({
          kind: "guest",
          authUser: currentUser,
          guest: guestUser,
        })
        setIsLoading(false)
        return
      }

      if (error || currentUser.is_anonymous) {
        setActor(null)
        setIsLoading(false)
        return
      }

      setActor({
        kind: "user",
        authUser: currentUser,
      })
      setIsLoading(false)
    }

    void loadActor()

    return () => {
      isCancelled = true
    }
  }, [currentUser])

  return {
    actor,
    isLoading,
  }
}
