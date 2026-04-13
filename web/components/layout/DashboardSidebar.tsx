"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarItem,
} from "@/components/layout/Sidebar"
import { useAppActor } from "@/lib/auth/use-app-actor"
import { useCurrentUser } from "@/lib/use-current-user"

const navigationLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/tickets", label: "Issues" },
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
            <div key={link.href} className="space-y-2">
              <SidebarItem
                href={link.href}
                isActive={isActive}
                onClick={onNavigate}
              >
                {link.label}
              </SidebarItem>
              <div className="ml-3 border-l border-[var(--color-nav-group-border)] pl-3">
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
