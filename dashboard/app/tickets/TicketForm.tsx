"use client"

import {
  ticketPriorityOptions,
  ticketStatusOptions,
  ticketTypeOptions,
  type TicketDraft,
} from "./types"

export function TicketForm({
  draft,
  error,
  isSubmitting,
  mode,
  onCancel,
  onChange,
  onSubmit,
}: {
  draft: TicketDraft
  error?: string
  isSubmitting: boolean
  mode: "create" | "edit"
  onCancel?: () => void
  onChange: (draft: TicketDraft) => void
  onSubmit: () => void
}) {
  const submitLabel =
    mode === "create"
      ? isSubmitting
        ? "Saving..."
        : "Add Ticket"
      : isSubmitting
        ? "Saving..."
        : "Save Changes"

  return (
    <div className="mt-5 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          type="text"
          value={draft.title}
          onChange={(event) =>
            onChange({
              ...draft,
              title: event.target.value,
            })
          }
          placeholder="Short summary of the issue or idea"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          rows={4}
          value={draft.description}
          onChange={(event) =>
            onChange({
              ...draft,
              description: event.target.value,
            })
          }
          placeholder="Add the context while it's fresh."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Type
          </label>
          <select
            value={draft.type}
            onChange={(event) =>
              onChange({
                ...draft,
                type: event.target.value as TicketDraft["type"],
              })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            {ticketTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Priority
          </label>
          <select
            value={draft.priority}
            onChange={(event) =>
              onChange({
                ...draft,
                priority: event.target.value as TicketDraft["priority"],
              })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            {ticketPriorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === "edit" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            value={draft.status}
            onChange={(event) =>
              onChange({
                ...draft,
                status: event.target.value as TicketDraft["status"],
              })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            {ticketStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <div className={mode === "edit" ? "flex justify-end gap-2" : undefined}>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 ${
            mode === "create" ? "w-full" : ""
          }`}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
