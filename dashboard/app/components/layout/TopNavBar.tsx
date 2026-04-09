"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { useAppActor } from "@/lib/auth/use-app-actor"

export function TopNavBar({
  breadcrumb,
  title = "Orchestra",
  currentUser,
  isAuthLoading = false,
  mobileNavTrigger,
  onLogout,
}: {
  breadcrumb?: {
    current: string
    href: string
    label: string
  }
  title?: string
  currentUser: User | null
  isAuthLoading?: boolean
  mobileNavTrigger?: ReactNode
  onLogout?: () => void
}) {
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false)
  const mobileAccountMenuRef = useRef<HTMLDivElement | null>(null)
  const { actor, isLoading: isActorLoading } = useAppActor(currentUser)
  const isGuestActor = actor?.kind === "guest"
  const identityLabel = isGuestActor
    ? actor.guest.display_name
    : currentUser?.email ?? ""

  useEffect(() => {
    if (!isMobileAccountMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (
        mobileAccountMenuRef.current &&
        event.target instanceof Node &&
        !mobileAccountMenuRef.current.contains(event.target)
      ) {
        setIsMobileAccountMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileAccountMenuOpen(false)
      }
    }

    window.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isMobileAccountMenuOpen])

  return (
    <header className="sticky top-0 z-50 h-[var(--header-height)] border-b border-slate-300 bg-slate-50 px-6 shadow-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {mobileNavTrigger ? (
            <div className="lg:hidden">{mobileNavTrigger}</div>
          ) : null}

          {breadcrumb ? (
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-900"
            >
              <Link
                href={breadcrumb.href}
                className="hidden truncate text-slate-700 transition-colors hover:text-slate-900 sm:inline"
              >
                {breadcrumb.label}
              </Link>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <span className="truncate text-slate-900">{breadcrumb.current}</span>
            </nav>
          ) : (
            <p className="truncate text-lg font-semibold text-slate-900">
              {title}
            </p>
          )}
        </div>

        <div className="flex min-w-[120px] sm:min-w-[240px] items-center justify-end gap-3">
          {isAuthLoading ? (
            <>
              <span
                aria-hidden="true"
                className="hidden h-4 w-40 animate-pulse rounded bg-slate-200 sm:inline-block"
              />
              <span
                aria-hidden="true"
                className="h-10 w-[92px] animate-pulse rounded-md border border-slate-200 bg-slate-100"
              />
            </>
          ) : currentUser ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">
                {identityLabel}
              </span>
              {!isGuestActor && !isActorLoading ? (
                <Link
                  href="/settings/account"
                  className="hidden text-sm font-medium text-slate-700 hover:underline sm:inline"
                >
                  Account
                </Link>
              ) : null}
              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:inline-flex"
                >
                  Log out
                </button>
              ) : null}
              {onLogout && !isGuestActor && !isActorLoading ? (
                <div
                  ref={mobileAccountMenuRef}
                  className="relative sm:hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isMobileAccountMenuOpen}
                    aria-haspopup="menu"
                    onClick={() =>
                      setIsMobileAccountMenuOpen((current) => !current)
                    }
                    className="inline-flex h-10 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Account
                  </button>

                  {isMobileAccountMenuOpen && (
                    <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Account
                      </p>
                      <div className="px-3 pb-2 text-sm text-slate-600">
                        {identityLabel}
                      </div>
                      <Link
                        href="/settings/account"
                        onClick={() => setIsMobileAccountMenuOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Account Settings
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileAccountMenuOpen(false)
                          onLogout()
                        }}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:underline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
