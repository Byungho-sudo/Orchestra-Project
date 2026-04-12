"use client"

import { useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { DashboardNavigationLinks } from "@/app/components/project-dashboard/DashboardSidebar"
import { Modal } from "@/components/ui/Modal"
import { useCurrentUser } from "@/lib/use-current-user"
import { TopNavBar } from "./TopNavBar"

export function AppLayout({
  breadcrumb,
  title,
  currentUser,
  onLogout,
  mobileProjectNavigation,
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
  children: ReactNode
}) {
  const {
    currentUser: fallbackCurrentUser,
    isLoading: isAuthLoading,
    logout: fallbackLogout,
  } = useCurrentUser()
  const [isGlobalMobileNavOpen, setIsGlobalMobileNavOpen] = useState(false)
  const resolvedMobileNavTrigger = (
    <button
      type="button"
      aria-label="Open app navigation"
      aria-expanded={isGlobalMobileNavOpen}
      onClick={() => setIsGlobalMobileNavOpen(true)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 lg:hidden"
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
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <TopNavBar
        breadcrumb={breadcrumb}
        title={title}
        currentUser={currentUser ?? fallbackCurrentUser}
        isAuthLoading={isAuthLoading}
        mobileNavTrigger={resolvedMobileNavTrigger}
        onLogout={onLogout ?? fallbackLogout}
      />

      <main className="mx-auto max-w-7xl px-[var(--layout-gap)] pb-6 pt-[var(--page-content-gap)]">
        {children}
      </main>

      {isGlobalMobileNavOpen ? (
        <Modal
          overlayClassName="fixed inset-0 z-50 bg-slate-900/40 overscroll-none lg:hidden"
          panelClassName="absolute left-0 top-0 h-full w-full max-w-sm overflow-y-auto overscroll-contain rounded-r-2xl bg-slate-50 p-5 shadow-xl"
          onClose={() => setIsGlobalMobileNavOpen(false)}
        >
          {({ requestClose }) => (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Orchestra
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    App Navigation
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={requestClose}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
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
