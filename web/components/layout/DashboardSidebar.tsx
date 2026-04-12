"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarItem,
  getSidebarItemClassName,
} from "@/components/layout/Sidebar"
import { useAppActor } from "@/lib/auth/use-app-actor"
import { useCurrentUser } from "@/lib/use-current-user"

const navigationLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/tickets", label: "Tickets" },
]

const guestNavigationHrefs = new Set(["/projects", "/tickets"])

export function DashboardNavigationLinks({
  onNavigate,
  projectNavigationContent,
}: {
  onNavigate?: () => void
  projectNavigationContent?: ReactNode
}) {
  const pathname = usePathname()
  const { currentUser } = useCurrentUser()
  const { actor } = useAppActor(currentUser)
  const visibleNavigationLinks =
    actor?.kind === "guest"
      ? navigationLinks.filter((link) => guestNavigationHrefs.has(link.href))
      : navigationLinks

  return (
    <nav className="space-y-2 text-sm">
      {visibleNavigationLinks.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`)

        if (link.href === "/projects" && projectNavigationContent) {
          return (
            <div key={link.href} className={getSidebarItemClassName(isActive)}>
              <p className="font-medium">{link.label}</p>
              <div className="mt-3 space-y-2 border-t border-[var(--color-nav-group-border)] pt-3">
                <Link
                  href="/projects"
                  onClick={onNavigate}
                  className="block rounded-lg px-3 py-2 text-sm text-[var(--color-nav-item-text)] transition-colors hover:bg-[var(--color-nav-item-hover-surface)] hover:text-[var(--color-nav-item-hover-text)]"
                >
                  All Projects
                </Link>
                {projectNavigationContent}
              </div>
            </div>
          )
        }

        return (
          <SidebarItem
            key={link.href}
            href={link.href}
            isActive={isActive}
            onClick={onNavigate}
          >
            {link.label}
          </SidebarItem>
        )
      })}
    </nav>
  )
}

export function DashboardSidebar() {
  return (
    <Sidebar title="Navigation">
      <DashboardNavigationLinks />
    </Sidebar>
  )
}
