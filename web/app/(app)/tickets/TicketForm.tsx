"use client"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
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
        : "Add Issue"
      : isSubmitting
        ? "Saving..."
        : "Save Changes"

  return (
    <div className="mt-5 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
          Title
        </label>
        <Input
          type="text"
          value={draft.title}
          onChange={(event) =>
            onChange({
              ...draft,
              title: event.target.value,
            })
          }
          placeholder="Short summary of the issue or idea"
          className="shadow-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
          Description
        </label>
        <Textarea
          rows={4}
          value={draft.description}
          onChange={(event) =>
            onChange({
              ...draft,
              description: event.target.value,
            })
          }
          placeholder="Add the context while it's fresh."
          className="min-h-28 resize-y shadow-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
            Type
          </label>
          <Select
            value={draft.type}
            onChange={(event) =>
              onChange({
                ...draft,
                type: event.target.value as TicketDraft["type"],
              })
            }
            className="shadow-none"
          >
            {ticketTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
            Priority
          </label>
          <Select
            value={draft.priority}
            onChange={(event) =>
              onChange({
                ...draft,
                priority: event.target.value as TicketDraft["priority"],
              })
            }
            className="shadow-none"
          >
            {ticketPriorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {mode === "edit" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--theme-card-foreground)]">
            Status
          </label>
          <Select
            value={draft.status}
            onChange={(event) =>
              onChange({
                ...draft,
                status: event.target.value as TicketDraft["status"],
              })
            }
            className="shadow-none"
          >
            {ticketStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-[var(--color-status-danger)]">
          {error}
        </p>
      ) : null}

      <div className={mode === "edit" ? "flex justify-end gap-2" : undefined}>
        {onCancel ? (
          <Button
            onClick={onCancel}
            disabled={isSubmitting}
            variant="secondary"
            className="shadow-none"
          >
            Cancel
          </Button>
        ) : null}
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`${
            mode === "create" ? "w-full" : ""
          }`}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
