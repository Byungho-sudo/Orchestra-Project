"use client"

import { isProjectModuleInstanceId } from "./helpers"
import { notesTemplates, useProjectNotes } from "./hooks/useProjectNotes"

function getSaveStateLabel(saveState: "idle" | "saving" | "saved" | "error") {
  if (saveState === "saving") return "Saving..."
  if (saveState === "saved") return "Saved"
  if (saveState === "error") return "Error"
  return "Autosave on"
}

function getSaveStateClassName(saveState: "idle" | "saving" | "saved" | "error") {
  if (saveState === "saving") return "text-slate-500"
  if (saveState === "saved") return "text-emerald-600"
  if (saveState === "error") return "text-red-600"
  return "text-slate-500"
}

export function NotesModule({
  moduleId,
  projectId,
}: {
  moduleId: string
  projectId: number
}) {
  const persistedModuleId = isProjectModuleInstanceId(moduleId)
  const {
    applyTemplate,
    content,
    error,
    hasContent,
    isLoading,
    saveState,
    schemaUnavailableMessage,
    selectedTemplateKey,
    setContent,
  } = useProjectNotes({
    enabled: persistedModuleId,
    moduleId: persistedModuleId ? moduleId : null,
    projectId,
  })

  return (
    <>
      <div className="flex flex-col gap-3 px-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Notes
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Capture planning notes, study material, and working documentation in one place.
          </p>
        </div>

        <p
          className={`text-xs font-semibold uppercase tracking-[0.2em] ${getSaveStateClassName(
            saveState
          )}`}
        >
          {getSaveStateLabel(saveState)}
        </p>
      </div>

      {!persistedModuleId && (
        <p className="mt-4 text-sm text-slate-500">
          Notes are still syncing to the saved workspace module.
        </p>
      )}

      {schemaUnavailableMessage && (
        <p className="mt-4 text-sm font-medium text-amber-700">
          {schemaUnavailableMessage}
        </p>
      )}

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {notesTemplates.map((template) => (
          <button
            key={template.key}
            type="button"
            onClick={() => applyTemplate(template.key)}
            disabled={!persistedModuleId || Boolean(schemaUnavailableMessage)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              selectedTemplateKey === template.key
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {template.label}
          </button>
        ))}
      </div>

      {!hasContent && !isLoading && !schemaUnavailableMessage && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
          Start with a blank note or choose a template above to scaffold planning, study notes, or a project log.
        </div>
      )}

      <div className="mt-6">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            isLoading
              ? "Loading notes..."
              : "Write project notes, research, ideas, and reference material here..."
          }
          rows={14}
          disabled={!persistedModuleId || Boolean(schemaUnavailableMessage)}
          className="min-h-[320px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-colors duration-200 focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>
    </>
  )
}
