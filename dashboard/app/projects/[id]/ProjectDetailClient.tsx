"use client"

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/app/components/layout/AppLayout"
import { ModalShell } from "@/app/components/project-dashboard/ModalShell"
import type { Project, ProjectVisibility } from "@/lib/projects"
import { useCurrentUser } from "@/lib/use-current-user"
import { ProjectContextPanel } from "./project-detail/ProjectContextPanel"
import { ProjectDetailHeader } from "./project-detail/ProjectDetailHeader"
import { ProjectHealthSummary } from "./project-detail/ProjectHealthSummary"
import { ProjectMobileContext } from "./project-detail/ProjectMobileContext"
import { ProjectMobileNavigation } from "./project-detail/ProjectMobileNavigation"
import { ProjectModuleContent } from "./project-detail/ProjectModuleContent"
import {
  customProjectModuleOptions,
  getEditableProjectModuleOptions,
  getProjectModuleDisplayTitle,
  getProjectModuleAnchor,
  isEnterCommitEvent,
  isRetiredProjectModuleType,
  normalizeMetadataDrafts,
  projectSectionAnchorOffsetPx,
} from "./project-detail/helpers"
import { ProjectModuleList } from "./project-detail/ProjectModuleList"
import { ProjectSidebarNav } from "./project-detail/ProjectSidebarNav"
import { useModuleDnD } from "./project-detail/hooks/useModuleDnD"
import { useProjectMetadata } from "./project-detail/hooks/useProjectMetadata"
import { useProjectModals } from "./project-detail/hooks/useProjectModals"
import { useProjectModules } from "./project-detail/hooks/useProjectModules"
import { useProjectMutations } from "./project-detail/hooks/useProjectMutations"
import { useNavDnD } from "./project-detail/hooks/useNavDnD"
import type {
  ProjectModuleType,
  ProjectWorkspaceModule,
} from "./project-detail/types"

export default function ProjectDetailClient({
  project,
}: {
  project: Project
}) {
  const editProjectFormId = "edit-project-form"
  const editModuleFormId = "edit-module-form"
  const addModuleFormId = "add-module-form"
  const router = useRouter()
  const { currentUser, logout } = useCurrentUser()
  const [activeSection, setActiveSection] = useState("")
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const pendingNavigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const observedSectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const sectionVisibilityRatiosRef = useRef<Record<string, number>>({})
  const {
    beginEditingProject,
    clearProjectDeleteError,
    clearProjectSummaryError,
    currentProject,
    deleteError,
    deleteProject,
    editForm,
    hasEditProjectChanges,
    isDeleting,
    isSaving,
    isSavingSummary,
    saveError,
    saveFieldErrors,
    setEditForm,
    setSaveFieldErrors,
    summaryError,
    updateProject,
    updateProjectSummaryFields,
  } = useProjectMutations({
    project,
    canCreatePrivateProject: Boolean(currentUser),
  })
  const {
    clearModuleError,
    createModule,
    createModuleForm,
    deleteModule,
    deletingModuleId,
    editModuleForm,
    hasCreateModuleChanges,
    hasEditModuleChanges,
    isCreatingModule,
    isResettingModules,
    isUpdatingModule,
    moduleError,
    movingModuleId,
    persistWorkspaceModuleOrder,
    prepareCreateModule,
    prepareEditModule,
    resetEditModuleDraft,
    resetModules,
    setCreateModuleForm,
    setEditModuleForm,
    sortedWorkspaceModules,
    updateModule,
    workspaceModules,
  } = useProjectModules({
    projectId: project.id,
  })
  const {
    closeAddModuleModal,
    closeDeleteProjectModal,
    closeEditModuleModal,
    closeEditProjectModal,
    closeMetadataEditModal,
    isAddModuleOpen,
    isDeleteOpen,
    isEditModuleOpen,
    isEditOpen,
    isMetadataEditOpen,
    openAddModuleModal,
    openDeleteProjectModal,
    openEditModuleModal,
    openEditProjectModal,
    openMetadataEditModal,
  } = useProjectModals()
  const visibleWorkspaceModules = sortedWorkspaceModules.filter(
    (module) => !isRetiredProjectModuleType(module.type)
  )
  const projectWorkspaceNavigation = [
    { id: "project-details", label: "Project Details", moduleId: null },
    ...visibleWorkspaceModules.map((module) => ({
      id: getProjectModuleAnchor(module),
      label: getProjectModuleDisplayTitle(module),
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
    activeDragSurface,
    commitModuleDrop,
    draggedModuleFrame,
    draggedModuleId,
    handleModulePointerDragStart,
    handleModuleSectionRefChange,
    moduleDropSlotIndex,
    projectedDropSurface,
    startSharedDrag,
    updateProjectedDropSurface,
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
    navDropSlotIndex,
  } = useNavDnD({
    activeDragSurface,
    activeDragModuleId: draggedModuleId,
    commitModuleDrop,
    isDragDisabled: isModuleDragDisabled,
    sortedWorkspaceModules,
    startSharedDrag,
    updateProjectedDropSurface,
  })
  const {
    addMetadataField,
    beginEditingMetadata,
    clearMetadataError,
    deleteMetadataField,
    isSavingMetadata,
    metadataSaveState,
    metadataError,
    metadataForm,
    saveMetadata,
    sortedProjectMetadata,
    stopEditingMetadata,
    updateMetadataField,
  } = useProjectMetadata({
    projectId: currentProject.id,
  })

  useEffect(() => {
    return () => {
      if (pendingNavigationTimeoutRef.current) {
        clearTimeout(pendingNavigationTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return
    }

    const observedSections = projectWorkspaceNavigationIds
      .map((sectionId) => observedSectionRefs.current[sectionId])
      .filter((section): section is HTMLElement => section instanceof HTMLElement)

    if (observedSections.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          sectionVisibilityRatiosRef.current[entry.target.id] =
            entry.isIntersecting ? entry.intersectionRatio : 0
        }

        const visibleSections = projectWorkspaceNavigationIds
          .map((sectionId) => {
            const sectionElement = observedSectionRefs.current[sectionId]

            if (!sectionElement) return null

            return {
              id: sectionId,
              ratio: sectionVisibilityRatiosRef.current[sectionId] ?? 0,
              topDistance: Math.abs(
                sectionElement.getBoundingClientRect().top -
                  (projectSectionAnchorOffsetPx + 80)
              ),
            }
          })
          .filter(
            (
              section
            ): section is {
              id: string
              ratio: number
              topDistance: number
            } => Boolean(section && section.ratio > 0)
          )

        if (visibleSections.length === 0) {
          return
        }

        visibleSections.sort((firstSection, secondSection) => {
          if (secondSection.ratio !== firstSection.ratio) {
            return secondSection.ratio - firstSection.ratio
          }

          return firstSection.topDistance - secondSection.topDistance
        })

        const nextActiveSectionId = visibleSections[0]?.id

        if (!nextActiveSectionId) {
          return
        }

        setActiveSection((currentSection) =>
          currentSection === nextActiveSectionId
            ? currentSection
            : nextActiveSectionId
        )
      },
      {
        root: null,
        rootMargin: "-96px 0px -20% 0px",
        threshold: [0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1],
      }
    )

    for (const sectionElement of observedSections) {
      observer.observe(sectionElement)
    }

    return () => {
      observer.disconnect()
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

  function handleCloseEditProjectModal() {
    if (isSaving) return

    closeEditProjectModal()
  }

  function handleCloseMetadataEditModal() {
    if (isSavingMetadata) return

    closeMetadataEditModal()
    clearMetadataError()
    stopEditingMetadata()
  }

  function handleCloseAddModuleModal() {
    if (isCreatingModule) return

    closeAddModuleModal()
    prepareCreateModule()
  }

  function handleCloseEditModuleModal() {
    if (isUpdatingModule) return

    closeEditModuleModal()
    resetEditModuleDraft()
  }

  function handleCloseDeleteProjectModal() {
    if (isDeleting) return

    closeDeleteProjectModal()
    clearProjectDeleteError()
  }

  async function handleCreateWorkspaceModule() {
    const didCreateModule = await createModule()

    if (didCreateModule) {
      closeAddModuleModal()
    }
  }

  async function handleUpdateWorkspaceModule() {
    const didUpdateModule = await updateModule()

    if (didUpdateModule) {
      closeEditModuleModal()
    }
  }

  async function handleDeleteWorkspaceModule(moduleId: string) {
    await deleteModule(moduleId)
  }

  async function handleResetWorkspaceModules() {
    await resetModules()
  }

  async function handleUpdateProject() {
    const didUpdateProject = await updateProject()

    if (didUpdateProject) {
      closeEditProjectModal()
    }
  }

  async function handleDoneEditingProjectMetadata() {
    const didSaveMetadata = hasMetadataChanges ? await saveMetadata() : true

    if (didSaveMetadata) {
      handleCloseMetadataEditModal()
    }
  }

  async function confirmDeleteProject() {
    const didDeleteProject = await deleteProject()

    if (!didDeleteProject) return

    closeDeleteProjectModal()
    router.push("/projects")
  }

  function handleOpenAddModuleModal() {
    prepareCreateModule()
    openAddModuleModal()
  }

  function handleOpenEditModuleModal(module: ProjectWorkspaceModule) {
    prepareEditModule(module)
    openEditModuleModal()
  }

  function handleOpenEditProjectModal() {
    beginEditingProject()
    clearProjectSummaryError()
    openEditProjectModal()
  }

  function handleOpenMetadataEditModal() {
    beginEditingMetadata()
    openMetadataEditModal()
  }

  function handleOpenDeleteProjectModal() {
    clearProjectDeleteError()
    openDeleteProjectModal()
  }

  function navigateToSection(targetId: string, href: string) {
    if (typeof window === "undefined") return

    if (!targetId) return

    const targetElement = observedSectionRefs.current[targetId]

    if (!targetElement) return

    setActiveSection(targetId)

    if (pendingNavigationTimeoutRef.current) {
      clearTimeout(pendingNavigationTimeoutRef.current)
    }

    pendingNavigationTimeoutRef.current = setTimeout(() => {
      pendingNavigationTimeoutRef.current = null
    }, 1200)

    const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches

    window.history.replaceState(null, "", href)
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: isMobileViewport ? "start" : "center",
    })
  }

  function handleObservedSectionRefChange(
    sectionId: string,
    element: HTMLElement | null
  ) {
    observedSectionRefs.current[sectionId] = element

    if (!element) {
      delete sectionVisibilityRatiosRef.current[sectionId]
    }
  }

  function handleWorkspaceModuleSectionRefChange(
    moduleId: string,
    element: HTMLElement | null
  ) {
    handleModuleSectionRefChange(moduleId, element)

    const workspaceModule = workspaceModules.find(
      (workspaceModule) => workspaceModule.id === moduleId
    )

    if (!workspaceModule) return

    handleObservedSectionRefChange(
      getProjectModuleAnchor(workspaceModule),
      element
    )
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

  function handleSelectSection(targetId: string) {
    navigateToSection(targetId, `#${targetId}`)
  }

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
  return (
    <>
      <AppLayout
        breadcrumb={{
          current: currentProject.name,
          href: "/projects",
          label: "Projects",
        }}
        title={currentProject.name}
        currentUser={currentUser}
        mobileNavTrigger={
          <button
            type="button"
            aria-label="Open module navigation"
            aria-expanded={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <span className="sr-only">Open module navigation</span>
            <span className="flex flex-col gap-1">
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
            </span>
          </button>
        }
        onLogout={logout}
      >
        <div className="grid gap-[var(--layout-gap)] lg:grid-cols-[180px_minmax(0,1fr)_300px] lg:items-start">
          <div className="hidden lg:block lg:sticky lg:top-[var(--sticky-panel-top)] lg:self-start lg:h-fit">
            <ProjectSidebarNav
              activeSection={activeSection}
              activeDragSurface={activeDragSurface}
              draggedModuleId={draggedModuleId}
              draggedNavItemFrame={draggedNavItemFrame}
              fixedItem={fixedProjectDetailsNavigationItem}
              isAddDisabled={
                isResettingModules ||
                isCreatingModule ||
                Boolean(deletingModuleId) ||
                Boolean(movingModuleId)
              }
              moduleDropSlotIndex={moduleDropSlotIndex}
              navDropSlotIndex={navDropSlotIndex}
              projectedDropSurface={projectedDropSurface}
              navListRef={navListRef}
              onAddModule={handleOpenAddModuleModal}
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
          </div>

          <div className="min-w-0">
            <section
              id="project-details"
              ref={(element) =>
                handleObservedSectionRefChange("project-details", element)
              }
              style={{ scrollMarginTop: `${projectSectionAnchorOffsetPx}px` }}
            >
              <ProjectDetailHeader project={currentProject} />
              <ProjectHealthSummary
                isUpdatingSummary={isSavingSummary}
                onUpdateSummaryFields={updateProjectSummaryFields}
                project={currentProject}
                summaryError={summaryError}
              />
            </section>

            <div className="mt-5 space-y-4 lg:hidden">
              <ProjectMobileContext
                currentProject={currentProject}
                onDeleteProject={() => {
                  handleOpenDeleteProjectModal()
                }}
                onEditMetadata={() => {
                  handleOpenMetadataEditModal()
                }}
                onEditProject={() => {
                  handleOpenEditProjectModal()
                }}
              />
            </div>

              <ProjectModuleList
                activeDragSurface={activeDragSurface}
                deletingModuleId={deletingModuleId}
                draggedModuleFrame={draggedModuleFrame}
                draggedModuleId={draggedModuleId}
                isCreatingModule={isCreatingModule}
                isResettingModules={isResettingModules}
                moduleDropSlotIndex={moduleDropSlotIndex}
                navDropSlotIndex={navDropSlotIndex}
                projectedDropSurface={projectedDropSurface}
                moduleError={moduleError}
                modules={visibleWorkspaceModules}
                movingModuleId={movingModuleId}
                onAddModule={handleOpenAddModuleModal}
                onDeleteModule={handleDeleteWorkspaceModule}
                onEditModule={handleOpenEditModuleModal}
                onHeaderPointerDown={handleModulePointerDragStart}
                onResetModules={handleResetWorkspaceModules}
                onSectionRefChange={handleWorkspaceModuleSectionRefChange}
                renderModuleContent={(module) => (
                  <ProjectModuleContent
                    currentProject={currentProject}
                    module={module}
                  />
                )}
              />
          </div>

          <div className="hidden lg:block lg:sticky lg:top-[var(--sticky-panel-top)] lg:self-start lg:h-fit">
            <ProjectContextPanel
              currentProject={currentProject}
              onDeleteProject={() => {
                handleOpenDeleteProjectModal()
              }}
              onEditMetadata={() => {
                handleOpenMetadataEditModal()
              }}
              onEditProject={() => {
                handleOpenEditProjectModal()
              }}
            />
          </div>
        </div>
      </AppLayout>

      <ProjectMobileNavigation
        activeSection={activeSection}
        fixedItem={fixedProjectDetailsNavigationItem}
        isAddDisabled={
          isResettingModules ||
          isCreatingModule ||
          Boolean(deletingModuleId) ||
          Boolean(movingModuleId)
        }
        isOpen={isMobileNavOpen}
        onAddModule={handleOpenAddModuleModal}
        onClose={() => setIsMobileNavOpen(false)}
        onSelectSection={handleSelectSection}
        sortableItems={sortableProjectWorkspaceNavigation}
      />

      {isEditOpen && (
        <ModalShell
          hasUnsavedChanges={hasEditProjectChanges}
          isDismissDisabled={isSaving}
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          panelClassName="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          onClose={handleCloseEditProjectModal}
        >
          {({ requestClose }) => (
            <>
            <h2 className="text-xl font-bold text-slate-900">Edit Project</h2>
            <p className="mt-1 text-sm text-slate-600">
              Update the project details below.
            </p>

            <form
              id={editProjectFormId}
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void handleUpdateProject()
              }}
            >
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
                  onKeyDown={(event) => {
                    if (!isEnterCommitEvent(event)) return

                    event.preventDefault()
                    void handleUpdateProject()
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
                  onKeyDown={(event) => {
                    if (!isEnterCommitEvent(event)) return

                    event.preventDefault()
                    void handleUpdateProject()
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
            </form>

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
                type="submit"
                form={editProjectFormId}
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
          onClose={handleCloseMetadataEditModal}
        >
          {({ requestClose }) => (
            <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Metadata
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Add only the custom fields that are relevant to this project.
                </p>
              </div>

              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                  metadataSaveState === "error"
                    ? "text-red-600"
                    : metadataSaveState === "saved"
                      ? "text-emerald-600"
                      : "text-slate-500"
                }`}
              >
                {metadataSaveState === "saving"
                  ? "Saving..."
                  : metadataSaveState === "saved"
                    ? "Saved"
                    : metadataSaveState === "error"
                      ? "Error"
                      : "Autosave on"}
              </p>
            </div>

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
                onClick={handleDoneEditingProjectMetadata}
                disabled={isSavingMetadata}
                className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingMetadata ? "Saving..." : "Done"}
              </button>
            </div>
            </>
          )}
        </ModalShell>
        )}

      {isEditModuleOpen && (
        <ModalShell
          hasUnsavedChanges={hasEditModuleChanges}
          isDismissDisabled={isUpdatingModule}
          panelClassName="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          onClose={handleCloseEditModuleModal}
        >
          {({ requestClose }) => (
            <>
              <h2 className="text-xl font-bold text-slate-900">Edit Module</h2>
              <p className="mt-1 text-sm text-slate-600">
                Update the selected module title and behavior type.
              </p>

              <form
                id={editModuleFormId}
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleUpdateWorkspaceModule()
                }}
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Module Title
                  </label>
                  <input
                    type="text"
                    value={editModuleForm.title}
                    onChange={(event) => {
                      setEditModuleForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                      if (moduleError) {
                        clearModuleError()
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
                    value={editModuleForm.type}
                    onChange={(event) =>
                      setEditModuleForm((current) => ({
                        ...current,
                        type: event.target.value as ProjectModuleType,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    {getEditableProjectModuleOptions(editModuleForm.type).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {moduleError && (
                  <p className="text-sm font-medium text-red-600">
                    {moduleError}
                  </p>
                )}
              </form>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => requestClose()}
                  disabled={isUpdatingModule}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form={editModuleFormId}
                  disabled={isUpdatingModule || !hasEditModuleChanges}
                  className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingModule ? "Saving..." : "Save Changes"}
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
          onClose={handleCloseAddModuleModal}
        >
          {({ requestClose }) => (
            <>
              <h2 className="text-xl font-bold text-slate-900">Add Module</h2>
              <p className="mt-1 text-sm text-slate-600">
                Create a new workspace module in the center column.
              </p>

              <form
                id={addModuleFormId}
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleCreateWorkspaceModule()
                }}
              >
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
                        clearModuleError()
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
              </form>

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
                  type="submit"
                  form={addModuleFormId}
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
          onClose={handleCloseDeleteProjectModal}
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

