export const defaultProjectModuleTemplates = [
  {
    id: "operations",
    title: "Planning / Operations",
    type: "planning_operations",
    order: 1,
  },
  {
    id: "checklist",
    title: "Checklist",
    type: "checklist",
    order: 2,
  },
  {
    id: "timeline",
    title: "Timeline",
    type: "timeline",
    order: 3,
  },
  {
    id: "assets",
    title: "Assets",
    type: "assets",
    order: 4,
  },
] as const

export type DefaultProjectModuleType =
  (typeof defaultProjectModuleTemplates)[number]["type"]

export type DefaultProjectWorkspaceModule =
  (typeof defaultProjectModuleTemplates)[number]

export const defaultProjectModuleAnchors =
  defaultProjectModuleTemplates.reduce<
    Record<DefaultProjectModuleType, string>
  >((anchors, module) => {
    anchors[module.type] = module.id
    return anchors
  }, {} as Record<DefaultProjectModuleType, string>)

export function getDefaultProjectWorkspaceModules(): DefaultProjectWorkspaceModule[] {
  return defaultProjectModuleTemplates.map((module) => ({ ...module }))
}

export function getDefaultProjectModuleRows(projectId: number) {
  return defaultProjectModuleTemplates.map((module) => ({
    project_id: projectId,
    title: module.title,
    type: module.type,
    order: module.order,
  }))
}
