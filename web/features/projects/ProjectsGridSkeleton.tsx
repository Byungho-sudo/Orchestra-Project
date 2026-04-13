import { Card } from "@/components/ui/Card"
import {
  ProjectsCardsGrid,
  ProjectsPageFrame,
} from "@/features/projects/ProjectsPageFrame"
import { ProjectsToolbarFrame } from "@/features/projects/ProjectsToolbarFrame"

export function ProjectsGridSkeleton() {
  return (
    <ProjectsPageFrame
      toolbar={
        <ProjectsToolbarFrame
        title={
          <div className="h-7 w-36 animate-pulse rounded bg-[var(--color-shell-hover)]" />
        }
        primaryControl={
          <div className="h-10 w-full animate-pulse rounded-md border border-[var(--theme-shell-border)] bg-[var(--theme-input)] sm:w-56" />
        }
        secondaryControls={
          <>
            <div className="h-10 w-24 animate-pulse rounded-md border border-[var(--theme-shell-border)] bg-[var(--theme-input)]" />
            <div className="h-4 w-12 animate-pulse rounded bg-[var(--color-shell-hover)]" />
            <div className="h-10 w-28 animate-pulse rounded-md border border-[var(--theme-shell-border)] bg-[var(--theme-input)]" />
            <div className="h-10 w-28 animate-pulse rounded-md bg-[var(--theme-primary)]/85" />
          </>
        }
        />
      }
    >
      <ProjectsCardsGrid>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card
            as="div"
            key={index}
            className="bg-[var(--theme-card)]"
          >
            <div className="h-5 w-7/12 animate-pulse rounded bg-[var(--color-card-track)]" />
            <div className="mt-1.5 h-4 w-11/12 animate-pulse rounded bg-[var(--color-card-separator)]" />
            <div className="mt-1.5 h-4 w-3/4 animate-pulse rounded bg-[var(--color-card-separator)]" />

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-card-track)]" />
                  <div className="h-3 w-8 animate-pulse rounded bg-[var(--color-card-track)]" />
                </div>
                <div className="h-1.5 animate-pulse rounded-full bg-[var(--color-card-progress-track)]" />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-card-track)]" />
                  <div className="h-3 w-16 animate-pulse rounded bg-[var(--color-card-track)]" />
                </div>
                <div className="h-1.5 animate-pulse rounded-full bg-[var(--color-card-deadline-track)]" />
              </div>

              <div className="border-t border-[var(--color-card-separator)] pt-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-28 animate-pulse rounded bg-[var(--color-card-track)]" />
                  <div className="h-5 w-[4.5rem] animate-pulse rounded-full border border-[var(--color-card-separator)] bg-[var(--color-card-track)]" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </ProjectsCardsGrid>
    </ProjectsPageFrame>
  )
}
