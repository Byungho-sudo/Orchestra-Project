import { AppLayout } from "@/components/layout/AppLayout"

export default function Loading() {
  return (
    <AppLayout title="Project">
      <div className="grid gap-[var(--layout-gap)] lg:grid-cols-[180px_minmax(0,1fr)_300px] lg:items-start">
        <div className="hidden lg:block lg:sticky lg:top-[var(--sticky-panel-top)] lg:self-start lg:h-fit">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--theme-card)] p-4 shadow-[var(--color-card-shadow)]">
            <div className="h-4 w-28 animate-pulse rounded bg-[var(--color-card-track)]" />
            <div className="mt-4 space-y-2">
              <div className="h-9 w-full animate-pulse rounded-lg bg-[var(--color-card-track)]" />
              <div className="h-9 w-full animate-pulse rounded-lg bg-[var(--color-card-track)]" />
              <div className="h-9 w-full animate-pulse rounded-lg bg-[var(--color-card-track)]" />
            </div>
          </div>
        </div>

        <div className="min-w-0 animate-pulse">
          <section>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--theme-card)] p-6 shadow-[var(--color-card-shadow)]">
              <div className="h-4 w-32 rounded bg-[var(--color-card-track)]" />
              <div className="mt-3 h-10 w-72 rounded bg-[var(--color-card-track)]" />
              <div className="mt-4 h-5 w-full rounded bg-[var(--color-card-separator)]" />
              <div className="mt-2 h-5 w-5/6 rounded bg-[var(--color-card-separator)]" />

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-background)] p-4">
                  <div className="h-3 w-20 rounded bg-[var(--color-card-track)]" />
                  <div className="mt-3 h-5 w-24 rounded bg-[var(--color-card-track)]" />
                </div>

                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-background)] p-4">
                  <div className="h-3 w-20 rounded bg-[var(--color-card-track)]" />
                  <div className="mt-3 h-5 w-16 rounded bg-[var(--color-card-track)]" />
                </div>

                <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-background)] p-4">
                  <div className="h-3 w-24 rounded bg-[var(--color-card-track)]" />
                  <div className="mt-3 h-5 w-24 rounded bg-[var(--color-card-track)]" />
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-[var(--color-card-border)] p-5">
                <div className="mb-3 flex justify-between">
                  <div className="h-4 w-24 rounded bg-[var(--color-card-track)]" />
                  <div className="h-4 w-10 rounded bg-[var(--color-card-track)]" />
                </div>
                <div className="h-3 w-full rounded-full bg-[var(--color-card-progress-track)]" />
              </div>
            </div>
          </section>
        </div>

        <div className="hidden lg:block lg:sticky lg:top-[var(--sticky-panel-top)] lg:self-start lg:h-fit">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-card-border)] bg-[var(--theme-card)] p-5 shadow-[var(--color-card-shadow)]">
            <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-card-track)]" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-[var(--color-card-separator)]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--color-card-separator)]" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-[var(--color-card-track)]" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
