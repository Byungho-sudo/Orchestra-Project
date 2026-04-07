"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  isProjectModuleNotesSchemaMissingError,
  logSupabaseMutationResult,
} from "../helpers"

type SaveState = "idle" | "saving" | "saved" | "error"

type ProjectModuleNoteRecord = {
  id: string
  project_id: number
  module_id: string
  content: string
  template_key: string | null
  created_at: string
  updated_at: string
}

const autosaveDelayMs = 700

export const notesTemplates = [
  {
    key: "planning",
    label: "Planning Template",
    content: `# Objective

What are we trying to achieve?

# Key Decisions

- 

# Open Questions

- 

# Next Steps

- 
`,
  },
  {
    key: "study",
    label: "Study Notes",
    content: `# Topic

# Key Concepts

- 

# Important References

- 

# Practice / Review

- 
`,
  },
  {
    key: "hobby",
    label: "Project Log",
    content: `# Idea

# Progress Log

- 

# Materials / Resources

- 

# Next Experiment

- 
`,
  },
] as const

export function useProjectNotes({
  enabled,
  moduleId,
  projectId,
}: {
  enabled: boolean
  moduleId: string | null
  projectId: number
}) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [schemaUnavailableMessage, setSchemaUnavailableMessage] = useState("")
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(
    null
  )
  const lastSavedContentRef = useRef("")
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const hasContent = useMemo(() => content.trim().length > 0, [content])

  const loadNotes = useCallback(async () => {
    if (!enabled || !moduleId) {
      setContent("")
      setError("")
      setSaveState("idle")
      setSchemaUnavailableMessage("")
      setSelectedTemplateKey(null)
      lastSavedContentRef.current = ""
      return
    }

    setIsLoading(true)
    setError("")
    setSchemaUnavailableMessage("")

    const { data, error, status, statusText } = await supabase
      .from("project_module_notes")
      .select("*")
      .eq("project_id", projectId)
      .eq("module_id", moduleId)
      .maybeSingle()

    logSupabaseMutationResult("Project notes fetch", {
      data,
      error,
      status,
      statusText,
    })

    if (!mountedRef.current) return

    setIsLoading(false)

    if (error) {
      if (isProjectModuleNotesSchemaMissingError(error)) {
        setSchemaUnavailableMessage(
          "Notes are unavailable until the project_module_notes table is created."
        )
        return
      }

      setError("Failed to load notes. Please refresh and try again.")
      return
    }

    const noteRow = data as ProjectModuleNoteRecord | null
    const nextContent = noteRow?.content ?? ""

    setContent(nextContent)
    setSelectedTemplateKey(noteRow?.template_key ?? null)
    lastSavedContentRef.current = nextContent
    setSaveState("idle")
  }, [enabled, moduleId, projectId])

  useEffect(() => {
    mountedRef.current = true
    void loadNotes()

    return () => {
      mountedRef.current = false

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [loadNotes])

  const persistNotes = useCallback(
    async (nextContent: string, templateKey: string | null) => {
      if (!enabled || !moduleId) return

      setSaveState("saving")
      setError("")

      const { data, error, status, statusText } = await supabase
        .from("project_module_notes")
        .upsert(
          {
            project_id: projectId,
            module_id: moduleId,
            content: nextContent,
            template_key: templateKey,
          },
          { onConflict: "module_id" }
        )
        .select("*")
        .single()

      logSupabaseMutationResult("Project notes save", {
        data,
        error,
        status,
        statusText,
      })

      if (!mountedRef.current) return

      if (error) {
        setSaveState("error")
        setError("Failed to save notes. Your latest edits are still in the editor.")
        return
      }

      const savedRow = data as ProjectModuleNoteRecord
      lastSavedContentRef.current = savedRow.content
      setSelectedTemplateKey(savedRow.template_key)
      setSaveState("saved")

      window.setTimeout(() => {
        if (!mountedRef.current) return

        setSaveState((currentState) =>
          currentState === "saved" ? "idle" : currentState
        )
      }, 1400)
    },
    [enabled, moduleId, projectId]
  )

  useEffect(() => {
    if (!enabled || !moduleId || schemaUnavailableMessage) return

    if (content === lastSavedContentRef.current) {
      return
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      autosaveTimeoutRef.current = null
      void persistNotes(content, selectedTemplateKey)
    }, autosaveDelayMs)

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [content, enabled, moduleId, persistNotes, schemaUnavailableMessage, selectedTemplateKey])

  const applyTemplate = useCallback(
    (templateKey: string) => {
      const template = notesTemplates.find((entry) => entry.key === templateKey)

      if (!template) return

      setSelectedTemplateKey(template.key)
      setContent((currentContent) =>
        currentContent.trim() ? `${currentContent.trim()}\n\n${template.content}` : template.content
      )
    },
    []
  )

  return {
    applyTemplate,
    content,
    error,
    hasContent,
    isLoading,
    saveState,
    schemaUnavailableMessage,
    selectedTemplateKey,
    setContent,
  }
}
