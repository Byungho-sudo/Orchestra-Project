"use client"

import { useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { DashboardNavigationLinks } from "@/components/layout/DashboardSidebar"
import { Modal } from "@/components/ui/Modal"
import {
  getThemeConfigFromUser,
  type ThemeConfig,
} from "@/lib/theme"
import { cn } from "@/lib/ui"
import { useCurrentUser } from "@/lib/use-current-user"
import { TopNavBar } from "./TopNavBar"

export function AppLayout({
  breadcrumb,
  title,
  currentUser,
  onLogout,
  mobileProjectNavigation,
  theme,
  rootClassName,
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
  mobileProjectNavigation?: (controls: { requestClose: () => void }) => ReactNode
  theme?: ThemeConfig
  rootClassName?: string
  children: ReactNode
}) {
  const {
    currentUser: fallbackCurrentUser,
    isLoading: isAuthLoading,
    logout: fallbackLogout,
  } = useCurrentUser()
  const [isGlobalMobileNavOpen, setIsGlobalMobileNavOpen] = useState(false)
  const resolvedCurrentUser = currentUser ?? fallbackCurrentUser
  const resolvedTheme = theme ?? getThemeConfigFromUser(resolvedCurrentUser)
  const resolvedMobileNavTrigger = (
    <button
      type="button"
      aria-label="Open app navigation"
      aria-expanded={isGlobalMobileNavOpen}
      onClick={() => setIsGlobalMobileNavOpen(true)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] text-[var(--color-shell-text)] hover:bg-[var(--color-shell-hover)] lg:hidden"
    >
      <span className="sr-only">Open app navigation</span>
      <span className="flex flex-col gap-1">
        <span className="block h-0.5 w-4 rounded-full bg-current" />
        <span className="block h-0.5 w-4 rounded-full bg-current" />
        <span className="block h-0.5 w-4 rounded-full bg-current" />
      </span>
    </button>
  )

  return (
    <div
      data-theme-family={resolvedTheme.family}
      data-theme-mode={resolvedTheme.mode}
      className={cn(
        "min-h-screen bg-[var(--theme-background)] text-[var(--theme-foreground)]",
        rootClassName
      )}
    >
      <TopNavBar
        breadcrumb={breadcrumb}
        title={title}
        currentUser={resolvedCurrentUser}
        isAuthLoading={isAuthLoading}
        mobileNavTrigger={resolvedMobileNavTrigger}
        onLogout={onLogout ?? fallbackLogout}
      />

      <main className="mx-auto max-w-7xl px-[var(--layout-gap)] pb-6 pt-[var(--page-content-gap)]">
        {children}
      </main>

      {isGlobalMobileNavOpen ? (
        <Modal
          overlayClassName="fixed inset-0 z-50 bg-black/45 overscroll-none lg:hidden"
          panelClassName="absolute left-0 top-0 h-full w-full max-w-sm overflow-y-auto overscroll-contain rounded-r-2xl border-r border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-5 shadow-xl"
          onClose={() => setIsGlobalMobileNavOpen(false)}
        >
          {({ requestClose }) => (
            <>
              <div className="flex items-center justify-between border-b border-[var(--color-shell-border)] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-shell-text-muted)]">
                    Orchestra
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-[var(--color-shell-text)]">
                    App Navigation
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={requestClose}
                  className="rounded-md border border-[var(--color-shell-border)] px-3 py-2 text-sm font-medium text-[var(--color-shell-text)] hover:bg-[var(--color-shell-hover)]"
                >
                  Close
                </button>
              </div>

              <div className="mt-4">
                <DashboardNavigationLinks
                  onNavigate={requestClose}
                  projectNavigationContent={mobileProjectNavigation?.({
                    requestClose,
                  })}
                />
              </div>
            </>
          )}
        </Modal>
      ) : null}
    </div>
  )
}
