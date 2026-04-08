"use client"

import Link from "next/link"
import type { MouseEventHandler, ReactNode } from "react"

export function getSidebarItemClassName(isActive: boolean) {
  return `block rounded-xl border px-3 py-3 text-sm transition-[border-color,background-color,box-shadow] duration-180 ${
    isActive
      ? "border-slate-200 bg-indigo-50/90 text-indigo-900 shadow-sm ring-1 ring-indigo-100"
      : "border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-sm"
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
      className={`h-fit self-start rounded-xl border border-slate-300 bg-slate-50 p-5 shadow-sm ${className}`.trim()}
    >
      {title ? (
        <h2 className="mb-4 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
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
