"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDashboardOverview } from "@/app/(app)/dashboard/use-dashboard-overview"
import { AppShell } from "@/app/components/project-dashboard/AppShell"
import { DashboardStatCard } from "@/app/components/project-dashboard/DashboardStatCard"
import { ProjectCard } from "@/features/projects/ProjectCard"
import { Card } from "@/components/ui/Card"
import { PageShell } from "@/components/ui/PageShell"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { getUserAccountLabel } from "@/lib/auth/display-identity"
import { useCurrentUser } from "@/lib/use-current-user"

export default function DashboardOverviewPage() {
  const router = useRouter()
  const { currentUser, logout } = useCurrentUser()
  const {
    activeProjects,
    completedProjects,
    errorMessage,
    loading,
    overdueProjects,
    recentProjects,
    totalProjects,
  } = useDashboardOverview()
  const accountLabel = currentUser
    ? getUserAccountLabel(currentUser)
    : "Browsing public projects"

  return (
    <AppShell title="Dashboard Overview" currentUser={currentUser} onLogout={logout}>
      <PageShell>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard label="Total Projects" value={totalProjects} />
          <DashboardStatCard label="Active Projects" value={activeProjects} />
          <DashboardStatCard label="Overdue Projects" value={overdueProjects} />
          <DashboardStatCard
            label="Completed Projects"
            value={completedProjects}
          />
        </section>

        <Card as="section">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Current Session
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--color-text-secondary)]">
                {accountLabel}
              </p>
            </div>

            <Link
              href="/projects"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Open Projects
            </Link>
          </div>
        </Card>

        <section className="space-y-4">
          <SectionHeader
            title="Recent Projects"
            action={
              <Link
                href="/projects"
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                View all
              </Link>
            }
          />

          {loading && <div className="p-6">Loading overview...</div>}

          {errorMessage && (
            <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {errorMessage}
            </Card>
          )}

          {!loading && !errorMessage && recentProjects.length === 0 && (
            <Card padding="lg" className="text-center">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                No recent projects
              </h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Open the Projects page to create your first project.
              </p>
            </Card>
          )}

          {!loading && !errorMessage && recentProjects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpenProject={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </PageShell>
    </AppShell>
  )
}
