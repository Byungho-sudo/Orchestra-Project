import type { DefaultProjectModuleType } from "@/lib/project-modules"

export type TaskSaveState = "idle" | "saving" | "saved" | "error"

export type ProjectModuleType =
  | DefaultProjectModuleType
  | "text_grid"
  | "notes"
  | "checklist"
  | "metrics"
  | "links"

export type ProjectWorkspaceModule = {
  id: string
  title: string
  type: ProjectModuleType
  order: number
}

export type ModuleDropPosition = "before" | "after"

export type ProjectModuleRecord = {
  id: string
  title: string
  type: ProjectModuleType
  order: number
}

export type CreateProjectModuleForm = {
  title: string
  type: ProjectModuleType
}

export type ProjectMetadataDraft = {
  id: string
  key: string
  value: string
  order: number
}
