"use client"

import type { ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { useCurrentUser } from "@/lib/use-current-user"
import { TopNavBar } from "./TopNavBar"

export function AppLayout({
  breadcrumb,
  title,
  currentUser,
  onLogout,
  mobileNavTrigger,
  children,
}: {
  breadcrumb?: {
    current: string
    href: string
    label: string
  }
  title: string
  currentUser?: User | null
  onLogout?: () => void
  mobileNavTrigger?: ReactNode
  children: ReactNode
}) {
  const {
    currentUser: fallbackCurrentUser,
    isLoading: isAuthLoading,
    logout: fallbackLogout,
  } = useCurrentUser()

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <TopNavBar
        breadcrumb={breadcrumb}
        title={title}
        currentUser={currentUser ?? fallbackCurrentUser}
        isAuthLoading={isAuthLoading}
        mobileNavTrigger={mobileNavTrigger}
        onLogout={onLogout ?? fallbackLogout}
      />

      <main className="mx-auto max-w-7xl px-[var(--layout-gap)] pb-6 pt-[var(--page-content-gap)]">
        {children}
      </main>
    </div>
  )
}
