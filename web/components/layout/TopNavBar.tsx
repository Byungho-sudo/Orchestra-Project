"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import {
  getNormalizedDisplayName,
  getUserAccountLabel,
} from "@/lib/auth/display-identity"
import { useAppActor } from "@/lib/auth/use-app-actor"
import { GuestSettingsMenu } from "./GuestSettingsMenu"

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
  const [guestDisplayName, setGuestDisplayName] = useState("")
  const identityLabel = isGuestActor
    ? getNormalizedDisplayName(guestDisplayName) ??
      getNormalizedDisplayName(actor.guest.display_name) ??
      getUserAccountLabel(currentUser)
    : getUserAccountLabel(currentUser)

  useEffect(() => {
    if (actor?.kind === "guest") {
      setGuestDisplayName(actor.guest.display_name)
      return
    }

    setGuestDisplayName("")
  }, [actor])

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
    <header className="sticky top-0 z-50 h-[var(--header-height)] border-b border-[var(--theme-shell-border)] bg-[var(--theme-shell)] px-6 shadow-[0_10px_24px_-20px_rgb(0_0_0_/_0.5)]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {mobileNavTrigger ? (
            <div className="lg:hidden">{mobileNavTrigger}</div>
          ) : null}

          {breadcrumb ? (
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 text-lg font-semibold text-[var(--color-shell-text)]"
            >
              <Link
                href={breadcrumb.href}
                className="hidden truncate text-[var(--theme-nav-muted)] transition-colors hover:text-[var(--theme-shell-foreground)] sm:inline"
              >
                {breadcrumb.label}
              </Link>
              <span className="hidden text-[var(--theme-shell-border)] sm:inline">/</span>
              <span className="truncate text-[var(--theme-shell-foreground)]">{breadcrumb.current}</span>
            </nav>
          ) : (
            <p className="truncate text-lg font-semibold text-[var(--theme-shell-foreground)]">
              {title}
            </p>
          )}
        </div>

        <div className="flex min-w-[120px] sm:min-w-[240px] items-center justify-end gap-3">
          {isAuthLoading ? (
            <>
              <span
                aria-hidden="true"
                className="hidden h-4 w-40 animate-pulse rounded bg-[var(--color-shell-muted-surface)] sm:inline-block"
              />
              <span
                aria-hidden="true"
                className="h-10 w-[92px] animate-pulse rounded-md border border-[var(--color-shell-border)] bg-[var(--color-shell-muted-surface)]"
              />
            </>
          ) : currentUser ? (
            <>
              {isGuestActor ? (
                <GuestSettingsMenu
                  currentDisplayName={identityLabel}
                  onSaved={setGuestDisplayName}
                />
              ) : (
                <span className="hidden text-sm text-[var(--theme-nav-muted)] sm:inline">
                  {identityLabel}
                </span>
              )}
              {!isGuestActor && !isActorLoading ? (
                <Link
                  href="/settings/account"
                  className="hidden text-sm font-medium text-[var(--theme-nav-muted)] hover:text-[var(--theme-shell-foreground)] hover:underline sm:inline"
                >
                  Account
                </Link>
              ) : null}
              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden rounded-md border border-[var(--theme-shell-border)] px-4 py-2 text-sm font-medium text-[var(--theme-shell-foreground)] hover:bg-[var(--theme-shell-muted)] sm:inline-flex"
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
                    className="inline-flex h-10 items-center rounded-md border border-[var(--theme-shell-border)] px-3 text-sm font-medium text-[var(--theme-shell-foreground)] hover:bg-[var(--theme-shell-muted)]"
                  >
                    Account
                  </button>

                  {isMobileAccountMenuOpen && (
                    <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-[var(--theme-shell-border)] bg-[var(--theme-shell)] p-2 shadow-lg">
                      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--theme-muted-foreground)]">
                        Account
                      </p>
                      <div className="px-3 pb-2 text-sm text-[var(--theme-nav-muted)]">
                        {identityLabel}
                      </div>
                      <Link
                        href="/settings/account"
                        onClick={() => setIsMobileAccountMenuOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--theme-shell-foreground)] hover:bg-[var(--theme-shell-muted)]"
                      >
                        Account Settings
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileAccountMenuOpen(false)
                          onLogout()
                        }}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--theme-shell-foreground)] hover:bg-[var(--theme-shell-muted)]"
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
                className="text-sm font-medium text-[var(--color-shell-text-secondary)] hover:text-[var(--color-shell-text)] hover:underline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-[var(--color-brand)] hover:underline"
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
