"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react"
import { useRouter } from "next/navigation"
import { ModalShell } from "@/app/components/project-dashboard/ModalShell"
import {
  getDeadlineBadgeClass,
  getDeadlineBarClass,
  getDeadlineFill,
  getDeadlineStatus,
} from "@/lib/project-deadline"
import type {
  Project,
  ProjectVisibility,
} from "@/lib/projects"
import {
  validateProjectForm,
  type ProjectFormErrors,
} from "@/lib/project-validation"
import {
  getDefaultProjectModuleRows,
  getDefaultProjectWorkspaceModules,
} from "@/lib/project-modules"
import { supabase } from "@/lib/supabase"
import { useCurrentUser } from "@/lib/use-current-user"
import { ProjectContextPanel } from "./project-detail/ProjectContextPanel"
import { ProjectDetailHeader } from "./project-detail/ProjectDetailHeader"
import { ProjectModuleContent } from "./project-detail/ProjectModuleContent"
import {
  customProjectModuleOptions,
  getProjectModuleAnchor,
  isProjectModulesSchemaMissingError,
  logSupabaseMutationResult,
  mapWorkspaceModules,
  normalizeMetadataDrafts,
  normalizeProgressInputValue,
  normalizeProgressOnBlur,
  normalizeWorkspaceModuleOrder,
  projectSectionAnchorOffsetPx,
} from "./project-detail/helpers"
import { ProjectModuleList } from "./project-detail/ProjectModuleList"
import { ProjectSidebarNav } from "./project-detail/ProjectSidebarNav"
import { useModuleDnD } from "./project-detail/hooks/useModuleDnD"
import { useProjectMetadata } from "./project-detail/hooks/useProjectMetadata"
import { useNavDnD } from "./project-detail/hooks/useNavDnD"
import { useProjectTasks } from "./project-detail/hooks/useProjectTasks"
import type {
  CreateProjectModuleForm,
  ProjectModuleRecord,
  ProjectModuleType,
  ProjectWorkspaceModule,
} from "./project-detail/types"

export default function ProjectDetailClient({
  project,
}: {
  project: Project
}) {
  const router = useRouter()
  const { currentUser } = useCurrentUser()

  const [currentProject, setCurrentProject] = useState<Project>(project)
  const [workspaceModules, setWorkspaceModules] =
    useState<ProjectWorkspaceModule[]>(getDefaultProjectWorkspaceModules())

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isMetadataEditOpen, setIsMetadataEditOpen] = useState(false)
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingModule, setIsCreatingModule] = useState(false)
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null)
  const [movingModuleId, setMovingModuleId] = useState<string | null>(null)
  const [isResettingModules, setIsResettingModules] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [moduleError, setModuleError] = useState("")
  const [saveFieldErrors, setSaveFieldErrors] = useState<ProjectFormErrors>({})
  const [deleteError, setDeleteError] = useState("")
  const [activeSection, setActiveSection] = useState("")
  const pendingNavigationSectionRef = useRef<string | null>(null)
  const pendingNavigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const [editForm, setEditForm] = useState({
    name: currentProject.name,
    description: currentProject.description ?? "",
    status: currentProject.status,
    progress: String(currentProject.progress),
    due_date: currentProject.due_date ?? "",
    visibility: currentProject.visibility,
  })

  const [createModuleForm, setCreateModuleForm] =
    useState<CreateProjectModuleForm>({
      title: "",
      type: "notes",
    })
  const sortedWorkspaceModules = [...workspaceModules].sort(
    (firstModule, secondModule) => firstModule.order - secondModule.order
  )
  const projectWorkspaceNavigation = [
    { id: "project-details", label: "Project Details", moduleId: null },
    ...sortedWorkspaceModules.map((module) => ({
      id: getProjectModuleAnchor(module),
      label: module.title,
      moduleId: module.id,
    })),
  ]
  const fixedProjectDetailsNavigationItem = projectWorkspaceNavigation[0]
  const sortableProjectWorkspaceNavigation = projectWorkspaceNavigation.slice(1)
  const projectWorkspaceNavigationIds = projectWorkspaceNavigation.map(
    (item) => item.id
  )
  const isModuleDragDisabled =
    Boolean(movingModuleId) ||
    Boolean(deletingModuleId) ||
    isResettingModules ||
    isCreatingModule
  const {
    commitModuleDrop,
    draggedModuleFrame,
    draggedModuleId,
    handleModulePointerDragStart,
    handleModuleSectionRefChange,
    moduleDropTarget,
    startSharedDrag,
    updateSharedDropTarget,
  } = useModuleDnD({
    isDragDisabled: isModuleDragDisabled,
    persistWorkspaceModuleOrder,
    sortedWorkspaceModules,
  })
  const {
    draggedNavItemFrame,
    handleNavItemClick,
    handleNavItemPointerDown,
    handleNavItemRefChange,
    navListRef,
  } = useNavDnD({
    activeDragModuleId: draggedModuleId,
    commitModuleDrop,
    isDragDisabled: isModuleDragDisabled,
    sortedWorkspaceModules,
    startSharedDrag,
    updateSharedDropTarget,
  })
  const { taskUi } = useProjectTasks({
    projectId: currentProject.id,
  })
  const {
    addMetadataField,
    beginEditingMetadata,
    clearMetadataError,
    deleteMetadataField,
    isSavingMetadata,
    metadataError,
    metadataForm,
    saveMetadata,
    sortedProjectMetadata,
    updateMetadataField,
  } = useProjectMetadata({
    projectId: currentProject.id,
  })

  const loadWorkspaceModules = useCallback(async () => {
    const { data, error, status, statusText } = await supabase
      .from("project_modules")
      .select("id,title,type,order")
      .eq("project_id", currentProject.id)
      .order("order", { ascending: true })
      .order("created_at", { ascending: true })

    logSupabaseMutationResult("Project modules fetch", {
      data,
      error,
      status,
      statusText,
    })

    if (error) {
      if (isProjectModulesSchemaMissingError(error)) {
        console.warn(
          "Project modules table is unavailable. Rendering default workspace modules only.",
          error
        )
        setWorkspaceModules(getDefaultProjectWorkspaceModules())
        return
      }

      console.error("Project modules fetch failed:", error)
      setWorkspaceModules(getDefaultProjectWorkspaceModules())
      return
    }

    const moduleRows = (data as ProjectModuleRecord[]) || []

    if (moduleRows.length > 0) {
      const normalizedModules = mapWorkspaceModules(moduleRows)

      if (
        moduleRows.some((moduleRow, moduleIndex) => moduleRow.order !== moduleIndex)
      ) {
        const { error: normalizeError } = await supabase
          .from("project_modules")
          .upsert(
            normalizedModules.map((module) => ({
              id: module.id,
              project_id: currentProject.id,
              title: module.title,
              type: module.type,
              order: module.order,
            })),
            { onConflict: "id" }
          )

        if (normalizeError) {
          console.warn(
            "Failed to normalize project module ordering. Rendering normalized order locally.",
            normalizeError
          )
        }
      }

      setWorkspaceModules(normalizedModules)
      return
    }

    const {
      data: defaultModulesData,
      error: defaultModulesError,
      status: defaultModulesStatus,
      statusText: defaultModulesStatusText,
    } = await supabase
      .from("project_modules")
      .insert(getDefaultProjectModuleRows(currentProject.id))
      .select("id,title,type,order")
      .order("order", { ascending: true })
      .order("created_at", { ascending: true })

    logSupabaseMutationResult("Default project modules insert", {
      data: defaultModulesData,
      error: defaultModulesError,
      status: defaultModulesStatus,
      statusText: defaultModulesStatusText,
    })

    if (defaultModulesError) {
      console.warn(
        "Failed to seed default project modules. Rendering local defaults only.",
        defaultModulesError
      )
      setWorkspaceModules(getDefaultProjectWorkspaceModules())
      return
    }

    const normalizedDefaultModules = mapWorkspaceModules(
      (defaultModulesData as ProjectModuleRecord[]) || []
    )

    setWorkspaceModules(normalizedDefaultModules)

    const { error: normalizeDefaultModulesError } = await supabase
      .from("project_modules")
      .upsert(
        normalizedDefaultModules.map((module) => ({
          id: module.id,
          project_id: currentProject.id,
          title: module.title,
          type: module.type,
          order: module.order,
        })),
        { onConflict: "id" }
      )

    if (normalizeDefaultModulesError) {
      console.warn(
        "Default project modules were created, but 0-based order normalization failed.",
        normalizeDefaultModulesError
      )
    }
  }, [currentProject.id])

  useEffect(() => {
    loadWorkspaceModules()
  }, [loadWorkspaceModules])

  useEffect(() => {
    return () => {
      if (pendingNavigationTimeoutRef.current) {
        clearTimeout(pendingNavigationTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const navigationSections = projectWorkspaceNavigationIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter((section): section is HTMLElement => section instanceof HTMLElement)

    if (navigationSections.length === 0) return

    const getClosestSectionId = () => {
      const pendingSectionId = pendingNavigationSectionRef.current

      if (pendingSectionId) {
        const pendingSection = navigationSections.find(
          (section) => section.id === pendingSectionId
        )

        if (pendingSection) {
          const pendingDistance = Math.abs(
            pendingSection.getBoundingClientRect().top -
              projectSectionAnchorOffsetPx
          )

          if (pendingDistance > 12) {
            return pendingSectionId
          }
        }

        pendingNavigationSectionRef.current = null
      }

      const rankedSections = navigationSections.map((section) => {
        const topOffset =
          section.getBoundingClientRect().top - projectSectionAnchorOffsetPx

        return {
          id: section.id,
          distance: Math.abs(topOffset),
        }
      })

      rankedSections.sort((firstSection, secondSection) => {
        return firstSection.distance - secondSection.distance
      })

      return rankedSections[0]?.id ?? navigationSections[0].id
    }

    let frameId = 0
    const updateActiveSection = () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(() => {
        setActiveSection(getClosestSectionId())
      })
    }

    updateActiveSection()

    window.addEventListener("scroll", updateActiveSection, { passive: true })
    window.addEventListener("resize", updateActiveSection)
    window.addEventListener("hashchange", updateActiveSection)

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }

      window.removeEventListener("scroll", updateActiveSection)
      window.removeEventListener("resize", updateActiveSection)
      window.removeEventListener("hashchange", updateActiveSection)
    }
  }, [projectWorkspaceNavigationIds])

  useEffect(() => {
    if (projectWorkspaceNavigationIds.length === 0) {
      setActiveSection("")
      return
    }

    setActiveSection((currentSection) =>
      projectWorkspaceNavigationIds.includes(currentSection)
        ? currentSection
        : projectWorkspaceNavigationIds[0]
    )
  }, [projectWorkspaceNavigationIds])

  function closeEditProjectModal() {
    if (isSaving) return

    setIsEditOpen(false)
    setSaveError("")
    setSaveFieldErrors({})
  }

  function closeMetadataEditModal() {
    if (isSavingMetadata) return

    setIsMetadataEditOpen(false)
    clearMetadataError()
  }

  function closeAddModuleModal() {
    if (isCreatingModule) return

    setIsAddModuleOpen(false)
    setModuleError("")
    setCreateModuleForm({
      title: "",
      type: "notes",
    })
  }

  function closeDeleteProjectModal() {
    if (isDeleting) return

    setIsDeleteOpen(false)
    setDeleteError("")
  }

  async function handleCreateWorkspaceModule() {
    if (isCreatingModule || isResettingModules || deletingModuleId || movingModuleId) {
      return
    }

    const moduleTitle = createModuleForm.title.trim()

    if (!moduleTitle) {
      setModuleError("Module title is required.")
      return
    }

    setModuleError("")
    setIsCreatingModule(true)

    const normalizedExistingModules = normalizeWorkspaceModuleOrder(
      workspaceModules
    )
    const nextOrder = normalizedExistingModules.length

    const { data, error, status, statusText } = await supabase
      .from("project_modules")
      .insert({
        project_id: currentProject.id,
        title: moduleTitle,
        type: createModuleForm.type,
        order: nextOrder,
      })
      .select("id,title,type,order")
      .single()

    logSupabaseMutationResult("Project module insert", {
      data,
      error,
      status,
      statusText,
    })

    setIsCreatingModule(false)

    if (error) {
      if (isProjectModulesSchemaMissingError(error)) {
        console.warn(
          "Project modules table is unavailable. Custom modules cannot be saved until the migration is applied.",
          error
        )
        setModuleError(
          "Custom modules are unavailable until the project_modules table is created."
        )
        setWorkspaceModules(getDefaultProjectWorkspaceModules())
        return
      }

      setModuleError("Failed to create module. Please try again.")
      return
    }

    const createdModule = data as ProjectModuleRecord
    const nextModules = normalizeWorkspaceModuleOrder([
      ...normalizedExistingModules,
      {
        id: createdModule.id,
        title: createdModule.title,
        type: createdModule.type,
        order: createdModule.order,
      },
    ])

    await persistWorkspaceModuleOrder(nextModules, createdModule.id, {
      useTemporaryOrders: false,
      errorMessage: "Failed to normalize module order after create.",
    })
    closeAddModuleModal()
  }

  async function handleDeleteWorkspaceModule(moduleId: string) {
    if (deletingModuleId || isResettingModules || movingModuleId) return

    setModuleError("")
    setDeletingModuleId(moduleId)

    const { error } = await supabase
      .from("project_modules")
      .delete()
      .eq("id", moduleId)
      .eq("project_id", currentProject.id)

    setDeletingModuleId(null)

    if (error) {
      if (isProjectModulesSchemaMissingError(error)) {
        console.warn(
          "Project modules table is unavailable. Module delete is disabled until the migration is applied.",
          error
        )
      } else {
        console.error("Project module delete failed:", error)
      }

      setModuleError("Failed to delete module. Please try again.")
      return
    }

    const nextModules = normalizeWorkspaceModuleOrder(
      workspaceModules
      .filter((module) => module.id !== moduleId)
    )

    setWorkspaceModules(nextModules)

    if (nextModules.length > 0) {
      await persistWorkspaceModuleOrder(nextModules, null, {
        useTemporaryOrders: false,
        restoreOnFailure: false,
        errorMessage: "Module was deleted, but order cleanup failed.",
      })
      return
    }

    await loadWorkspaceModules()
  }

  async function persistWorkspaceModuleOrder(
    nextModules: ProjectWorkspaceModule[],
    activeModuleId: string | null,
    options?: {
      errorMessage?: string
      restoreOnFailure?: boolean
      useTemporaryOrders?: boolean
    }
  ) {
    const normalizedModules = normalizeWorkspaceModuleOrder(nextModules)
    const previousModules = workspaceModules
    const errorMessage =
      options?.errorMessage ?? "Failed to reorder module. Please try again."
    const restoreOnFailure = options?.restoreOnFailure ?? true
    const useTemporaryOrders = options?.useTemporaryOrders ?? true

    setModuleError("")
    setMovingModuleId(activeModuleId)
    setWorkspaceModules(normalizedModules)

    if (useTemporaryOrders && normalizedModules.length > 0) {
      const { error: reserveTemporaryOrdersError } = await supabase
        .from("project_modules")
        .upsert(
          normalizedModules.map((module, moduleIndex) => ({
            id: module.id,
            project_id: currentProject.id,
            title: module.title,
            type: module.type,
            order: -1 * (moduleIndex + 1),
          })),
          { onConflict: "id" }
        )

      if (reserveTemporaryOrdersError) {
        console.error(
          "Project module reorder failed while reserving temporary orders:",
          reserveTemporaryOrdersError
        )
        if (restoreOnFailure) {
          setWorkspaceModules(previousModules)
        }
        setMovingModuleId(null)
        setModuleError(errorMessage)
        await loadWorkspaceModules()
        return false
      }
    }

    const { error: finalizeOrderError } = await supabase
      .from("project_modules")
      .upsert(
        normalizedModules.map((module) => ({
          id: module.id,
          project_id: currentProject.id,
          title: module.title,
          type: module.type,
          order: module.order,
        })),
        { onConflict: "id" }
      )

    setMovingModuleId(null)

    if (finalizeOrderError) {
      console.error(
        "Project module reorder failed while finalizing orders:",
        finalizeOrderError
      )
      if (restoreOnFailure) {
        setWorkspaceModules(previousModules)
      }
      setModuleError(errorMessage)
      await loadWorkspaceModules()
      return false
    }

    return true
  }

  async function handleMoveWorkspaceModule(
    moduleId: string,
    direction: "up" | "down"
  ) {
    if (movingModuleId || deletingModuleId || isResettingModules || isCreatingModule) {
      return
    }

    const sortedModules = [...workspaceModules].sort(
      (firstModule, secondModule) => firstModule.order - secondModule.order
    )
    const moduleIndex = sortedModules.findIndex(
      (module) => module.id === moduleId
    )
    const swapIndex = direction === "up" ? moduleIndex - 1 : moduleIndex + 1

    if (
      moduleIndex === -1 ||
      swapIndex < 0 ||
      swapIndex >= sortedModules.length
    ) {
      return
    }

    const reorderedModules = [...sortedModules]
    const [movedModule] = reorderedModules.splice(moduleIndex, 1)
    reorderedModules.splice(swapIndex, 0, movedModule)

    await persistWorkspaceModuleOrder(reorderedModules, moduleId)
  }

  async function handleResetWorkspaceModules() {
    if (isResettingModules || isCreatingModule || deletingModuleId || movingModuleId) {
      return
    }

    setModuleError("")
    setIsResettingModules(true)

    const { error: deleteError } = await supabase
      .from("project_modules")
      .delete()
      .eq("project_id", currentProject.id)

    if (deleteError) {
      console.error("Project module reset delete failed:", deleteError)
      setModuleError("Failed to reset modules. Please try again.")
      setIsResettingModules(false)
      return
    }

    const { error: insertError } = await supabase
      .from("project_modules")
      .insert(getDefaultProjectModuleRows(currentProject.id))

    if (insertError) {
      console.error("Project module reset insert failed:", insertError)
      setModuleError("Failed to recreate default modules. Please try again.")
      setIsResettingModules(false)
      return
    }

    await loadWorkspaceModules()
    setIsResettingModules(false)
  }

  async function handleUpdateProject() {
    if (isSaving) return

    setSaveError("")

    const validation = validateProjectForm(
      {
        name: editForm.name,
        description: editForm.description,
        due_date: editForm.due_date,
        progress: editForm.progress,
        visibility: editForm.visibility,
      },
      editForm.visibility === "private" || Boolean(currentUser)
    )

    setSaveFieldErrors(validation.errors)

    if (!validation.isValid) return

    setIsSaving(true)

    const updates = {
      name: validation.values.name,
      description: validation.values.description,
      status: editForm.status,
      progress: validation.values.progress ?? currentProject.progress,
      due_date: validation.values.due_date,
      visibility: validation.values.visibility,
    }

    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", currentProject.id)

    setIsSaving(false)

    if (error) {
      setSaveError("Failed to update project. Please try again.")
      return
    }

    setCurrentProject((current) => ({ ...current, ...updates }))
    setIsEditOpen(false)
    router.refresh()
  }

  async function handleSaveProjectMetadata() {
    const didSaveMetadata = await saveMetadata()

    if (didSaveMetadata) {
      setIsMetadataEditOpen(false)
    }
  }

  async function confirmDeleteProject() {
    if (isDeleting) return

    setDeleteError("")
    setIsDeleting(true)

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", currentProject.id)

    setIsDeleting(false)

    if (error) {
      setDeleteError("Failed to delete project. Please try again.")
      return
    }

    setIsDeleteOpen(false)
    router.push("/projects")
  }

  function navigateToSection(targetId: string, href: string) {
    if (typeof window === "undefined") return

    if (!targetId) return

    const targetElement = document.getElementById(targetId)

    if (!targetElement) return

    setActiveSection(targetId)
    pendingNavigationSectionRef.current = targetId

    if (pendingNavigationTimeoutRef.current) {
      clearTimeout(pendingNavigationTimeoutRef.current)
    }

    pendingNavigationTimeoutRef.current = setTimeout(() => {
      pendingNavigationSectionRef.current = null
      pendingNavigationTimeoutRef.current = null
    }, 1200)

    window.history.replaceState(null, "", href)
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  function handleNavigationClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    const targetId = href.startsWith("#") ? href.slice(1) : href

    if (!targetId) return

    event.preventDefault()
    navigateToSection(targetId, href)
  }

  function openAddModuleModal() {
    setModuleError("")
    setCreateModuleForm({
      title: "",
      type: "notes",
    })
    setIsAddModuleOpen(true)
  }

  const deadlineStatus = getDeadlineStatus(currentProject.due_date)
  const hasEditProjectChanges =
    editForm.name !== currentProject.name ||
    editForm.description !== (currentProject.description ?? "") ||
    editForm.status !== currentProject.status ||
    editForm.progress !== String(currentProject.progress) ||
    editForm.due_date !== (currentProject.due_date ?? "") ||
    editForm.visibility !== currentProject.visibility
  const hasMetadataChanges =
    JSON.stringify(normalizeMetadataDrafts(metadataForm)) !==
    JSON.stringify(
      sortedProjectMetadata.map((metadata, metadataIndex) => ({
        id: metadata.id,
        key: metadata.key,
        value: metadata.value,
        order: metadataIndex + 1,
      }))
    )
  const hasCreateModuleChanges =
    createModuleForm.title.trim() !== "" || createModuleForm.type !== "notes"

  return (
    <>
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[180px_minmax(0,1fr)_300px] lg:items-start">
          <ProjectSidebarNav
            activeSection={activeSection}
            draggedModuleId={draggedModuleId}
            draggedNavItemFrame={draggedNavItemFrame}
            fixedItem={fixedProjectDetailsNavigationItem}
            isAddDisabled={
              isResettingModules ||
              isCreatingModule ||
              Boolean(deletingModuleId) ||
              Boolean(movingModuleId)
            }
            moduleDropTarget={moduleDropTarget}
            navListRef={navListRef}
            onAddModule={openAddModuleModal}
            onFixedItemClick={(event) =>
              handleNavigationClick(event, `#${fixedProjectDetailsNavigationItem.id}`)
            }
            onModuleItemClick={(event, itemId, href) =>
              handleNavItemClick(event, itemId, () =>
                handleNavigationClick(event, href)
              )
            }
            onModuleItemPointerDown={handleNavItemPointerDown}
            onModuleItemRefChange={handleNavItemRefChange}
            sortableItems={sortableProjectWorkspaceNavigation}
          />

          <div className="min-w-0">
            <section
              id="project-details"
              style={{ scrollMarginTop: `${projectSectionAnchorOffsetPx}px` }}
            >
              <ProjectDetailHeader project={currentProject} />
            </section>

            <ProjectModuleList
              deletingModuleId={deletingModuleId}
              draggedModuleFrame={draggedModuleFrame}
              draggedModuleId={draggedModuleId}
              isCreatingModule={isCreatingModule}
              isResettingModules={isResettingModules}
              moduleDropTarget={moduleDropTarget}
              moduleError={moduleError}
              modules={sortedWorkspaceModules}
              movingModuleId={movingModuleId}
              onAddModule={openAddModuleModal}
              onDeleteModule={handleDeleteWorkspaceModule}
              onHeaderPointerDown={handleModulePointerDragStart}
              onMoveModule={handleMoveWorkspaceModule}
              onResetModules={handleResetWorkspaceModules}
              onSectionRefChange={handleModuleSectionRefChange}
              renderModuleContent={(module) => (
                <ProjectModuleContent
                  currentProject={currentProject}
                  module={module}
                  sortedProjectMetadata={sortedProjectMetadata}
                  taskUi={taskUi}
                />
              )}
            />
          </div>

          <ProjectContextPanel
            currentProject={currentProject}
            deadlineBadge={{
              className: getDeadlineBadgeClass(deadlineStatus),
              fillClassName: getDeadlineBarClass(deadlineStatus),
              label: deadlineStatus,
            }}
            deadlineFill={getDeadlineFill(currentProject.due_date)}
            onDeleteProject={() => {
              setDeleteError("")
              setIsDeleteOpen(true)
            }}
            onEditMetadata={() => {
              beginEditingMetadata()
              setIsMetadataEditOpen(true)
            }}
            onEditProject={() => {
              setEditForm({
                name: currentProject.name,
                description: currentProject.description ?? "",
                status: currentProject.status,
                progress: String(currentProject.progress),
                due_date: currentProject.due_date ?? "",
                visibility: currentProject.visibility,
              })
              setSaveError("")
              setSaveFieldErrors({})
              setIsEditOpen(true)
            }}
          />
        </div>
      </main>

      {isEditOpen && (
        <ModalShell
          hasUnsavedChanges={hasEditProjectChanges}
          isDismissDisabled={isSaving}
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          panelClassName="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          onClose={closeEditProjectModal}
        >
          {({ requestClose }) => (
            <>
            <h2 className="text-xl font-bold text-slate-900">Edit Project</h2>
            <p className="mt-1 text-sm text-slate-600">
              Update the project details below.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => {
                    setEditForm({ ...editForm, name: e.target.value })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      name: undefined,
                    }))
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
                {saveFieldErrors.name && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {saveFieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => {
                    setEditForm({ ...editForm, description: e.target.value })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      description: undefined,
                    }))
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
                {saveFieldErrors.description && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {saveFieldErrors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value as Project["status"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Progress
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.progress}
                  onChange={(e) => {
                    setEditForm({
                      ...editForm,
                      progress: normalizeProgressInputValue(e.target.value),
                    })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      progress: undefined,
                    }))
                  }}
                  onBlur={() =>
                    setEditForm((current) => ({
                      ...current,
                      progress: normalizeProgressOnBlur(
                        current.progress,
                        currentProject.progress
                      ),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
                {saveFieldErrors.progress && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {saveFieldErrors.progress}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => {
                    setEditForm({ ...editForm, due_date: e.target.value })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      due_date: undefined,
                    }))
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
                {saveFieldErrors.due_date && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {saveFieldErrors.due_date}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Visibility
                </label>
                <select
                  value={editForm.visibility}
                  onChange={(e) => {
                    setEditForm({
                      ...editForm,
                      visibility: e.target.value as ProjectVisibility,
                    })
                    setSaveFieldErrors((current) => ({
                      ...current,
                      visibility: undefined,
                    }))
                  }}
                  className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
                {saveFieldErrors.visibility && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {saveFieldErrors.visibility}
                  </p>
                )}
              </div>

              {saveError && (
                <p className="text-sm font-medium text-red-600">{saveError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSaving}
                className="inline-flex cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateProject}
                disabled={isSaving || !editForm.name.trim()}
                className="inline-flex cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
            </>
          )}
        </ModalShell>
      )}

      {isMetadataEditOpen && (
        <ModalShell
          hasUnsavedChanges={hasMetadataChanges}
          isDismissDisabled={isSavingMetadata}
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          panelClassName="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          onClose={closeMetadataEditModal}
        >
          {({ requestClose }) => (
            <>
            <h2 className="text-xl font-bold text-slate-900">
              Edit Metadata
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Add only the custom fields that are relevant to this project.
            </p>

            <div className="mt-6 space-y-4">
              {metadataForm.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  No custom metadata yet. Add a field to describe what matters for this project.
                </div>
              )}

              {metadataForm.map((metadata) => (
                <div
                  key={metadata.id}
                  className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,220px)_1fr_auto]"
                >
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Field Label
                    </label>
                    <input
                      type="text"
                      value={metadata.key}
                      onChange={(event) =>
                        updateMetadataField(
                          metadata.id,
                          "key",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Value
                    </label>
                    <textarea
                      rows={2}
                      value={metadata.value}
                      onChange={(event) =>
                        updateMetadataField(
                          metadata.id,
                          "value",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => deleteMetadataField(metadata.id)}
                      className="inline-flex rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addMetadataField}
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Add Custom Field
              </button>
            </div>

            {metadataError && (
              <p className="mt-4 text-sm font-medium text-red-600">
                {metadataError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSavingMetadata}
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProjectMetadata}
                disabled={isSavingMetadata}
                className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingMetadata ? "Saving..." : "Save Metadata"}
              </button>
            </div>
            </>
          )}
        </ModalShell>
      )}

      {isAddModuleOpen && (
        <ModalShell
          hasUnsavedChanges={hasCreateModuleChanges}
          isDismissDisabled={isCreatingModule}
          panelClassName="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          onClose={closeAddModuleModal}
        >
          {({ requestClose }) => (
            <>
              <h2 className="text-xl font-bold text-slate-900">Add Module</h2>
              <p className="mt-1 text-sm text-slate-600">
                Create a new workspace module in the center column.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Module Title
                  </label>
                  <input
                    type="text"
                    value={createModuleForm.title}
                    onChange={(event) => {
                      setCreateModuleForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                      if (moduleError && event.target.value.trim()) {
                        setModuleError("")
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Module Type
                  </label>
                  <select
                    value={createModuleForm.type}
                    onChange={(event) =>
                      setCreateModuleForm((current) => ({
                        ...current,
                        type: event.target.value as ProjectModuleType,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    {customProjectModuleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {moduleError && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  {moduleError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={isCreatingModule}
                  className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreateWorkspaceModule}
                  disabled={isCreatingModule || !createModuleForm.title.trim()}
                  className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {isCreatingModule ? "Creating..." : "Create Module"}
                </button>
              </div>
            </>
          )}
        </ModalShell>
      )}

      {isDeleteOpen && (
        <ModalShell
          isDismissDisabled={isDeleting}
          panelClassName="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          onClose={closeDeleteProjectModal}
        >
          {({ requestClose }) => (
            <>
            <h3 className="text-lg font-semibold text-slate-900">
              Delete Project
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {currentProject.name}
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && (
              <p className="mt-4 text-sm font-medium text-red-600">
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={requestClose}
                disabled={isDeleting}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                disabled={isDeleting}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>
            </>
          )}
        </ModalShell>
      )}
    </>
  )
}

