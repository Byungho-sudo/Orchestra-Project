export function ModuleStackFooter({
  isBusy,
  isCreatingModule,
  isResettingModules,
  onAddModule,
  onResetModules,
}: {
  isBusy: boolean
  isCreatingModule: boolean
  isResettingModules: boolean
  onAddModule: () => void
  onResetModules: () => void
}) {
  return (
    <div className="pt-6">
      <div className="space-y-4">
        <button
          type="button"
          onClick={onAddModule}
          disabled={isBusy}
          className="group flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-slate-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-2xl font-light text-slate-700 transition-colors group-hover:border-slate-400 group-hover:text-slate-900">
            +
          </span>
          <span className="mt-4 text-base font-semibold text-slate-900">
            {isCreatingModule ? "Creating module..." : "Add Module"}
          </span>
          <span className="mt-1 text-sm text-slate-500">
            Insert a new module into this workspace.
          </span>
        </button>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onResetModules}
            disabled={isBusy}
            className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResettingModules ? "Resetting..." : "Reset to default"}
          </button>
        </div>
      </div>
    </div>
  )
}
