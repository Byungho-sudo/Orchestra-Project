export function ProjectsGridSkeleton() {
  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="h-10 w-full animate-pulse rounded-md bg-slate-200 sm:w-56" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-28 animate-pulse rounded-md bg-slate-200" />
            <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-28 animate-pulse rounded-md bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-300 bg-slate-50 p-5 shadow-sm"
          >
            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-slate-100" />

            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-8 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="h-2 animate-pulse rounded-full bg-slate-200" />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="h-2 animate-pulse rounded-full bg-slate-200" />
              </div>

              <div className="flex items-center gap-2">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
