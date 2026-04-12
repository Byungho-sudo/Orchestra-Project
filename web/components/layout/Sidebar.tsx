"use client"

import Link from "next/link"
import type { MouseEventHandler, ReactNode } from "react"

export function getSidebarItemClassName(isActive: boolean) {
  return `block rounded-xl border px-3 py-3 text-sm font-medium transition-[border-color,background-color,color,box-shadow] duration-180 ${
    isActive
      ? "border-[var(--theme-nav-active)] bg-[var(--theme-nav-active)] text-[var(--theme-nav-active-foreground)] shadow-[0_10px_20px_-16px_var(--theme-nav-active)]"
      : "border-[var(--theme-nav-border)] bg-[var(--theme-nav-item-surface)] text-[var(--theme-nav-muted)] hover:border-[var(--theme-nav-hover-border)] hover:bg-[var(--theme-nav-hover)] hover:text-[var(--theme-nav-hover-foreground)] hover:shadow-[0_8px_16px_-16px_rgb(0_0_0_/_0.45)]"
  }`
}

export function Sidebar({
  children,
  className = "",
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <aside
      className={`h-fit self-start rounded-xl border border-[var(--theme-nav-border)] bg-[var(--theme-nav)] p-5 shadow-[0_16px_28px_-24px_rgb(0_0_0_/_0.45)] ${className}`.trim()}
    >
      {title ? (
        <h2 className="mb-4 px-1 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--theme-nav-muted)]">
          {title}
        </h2>
      ) : null}
      {children}
    </aside>
  )
}

export function SidebarItem({
  ariaCurrent,
  children,
  className = "",
  disabled = false,
  href,
  isActive = false,
  onClick,
  rel,
  target,
  type = "button",
}: {
  ariaCurrent?: "location" | "page" | undefined
  children: ReactNode
  className?: string
  disabled?: boolean
  href?: string
  isActive?: boolean
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>
  rel?: string
  target?: string
  type?: "button" | "submit" | "reset"
}) {
  const resolvedClassName =
    `${getSidebarItemClassName(isActive)} ${className}`.trim()

  if (href) {
    return (
      <Link
        href={href}
        aria-current={ariaCurrent}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement> | undefined}
        rel={rel}
        target={target}
        className={resolvedClassName}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      aria-current={ariaCurrent}
      disabled={disabled}
      type={type}
      onClick={onClick as MouseEventHandler<HTMLButtonElement> | undefined}
      className={resolvedClassName}
    >
      {children}
    </button>
  )
}
