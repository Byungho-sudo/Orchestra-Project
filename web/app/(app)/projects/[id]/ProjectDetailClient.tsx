"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/AppLayout"
import { SidebarItem } from "@/components/layout/Sidebar"
import type { Project } from "@/lib/projects"
import { AddModuleModal } from "@/features/project-detail/components/AddModuleModal"
import { DeleteProjectModal } from "@/features/project-detail/components/DeleteProjectModal"
import { EditMetadataModal } from "@/features/project-detail/components/EditMetadataModal"
import { EditModuleModal } from "@/features/project-detail/components/EditModuleModal"
import { EditProjectModal } from "@/features/project-detail/components/EditProjectModal"
import { useCurrentUser } from "@/lib/use-current-user"
import { ProjectContextPanel } from "./project-detail/ProjectContextPanel"
import { ProjectDetailHeader } from "./project-detail/ProjectDetailHeader"
import { ProjectHealthSummary } from "./project-detail/ProjectHealthSummary"
import { ProjectMobileContext } from "./project-detail/ProjectMobileContext"
import { ProjectModuleContent } from "./project-detail/ProjectModuleContent"
import {
  customProjectModuleOptions,
  getProjectModuleDisplayTitle,
  getProjectModuleAnchor,
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
import type { ProjectWorkspaceModule } from "./project-detail/types"

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
  const [observedActiveSection, setObservedActiveSection] = useState("")
  const [manualActiveSection, setManualActiveSection] = useState<string | null>(
    null
  )
  const pendingNavigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const pendingNavigationTargetRef = useRef<string | null>(null)
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
  const visibleWorkspaceModules = useMemo(
    () =>
      sortedWorkspaceModules.filter(
        (module) => !isRetiredProjectModuleType(module.type)
      ),
    [sortedWorkspaceModules]
  )
  const projectWorkspaceNavigation = useMemo(
    () => [
      { id: "project-details", label: "Project Details", moduleId: null },
      ...visibleWorkspaceModules.map((module) => ({
        id: getProjectModuleAnchor(module),
        label: getProjectModuleDisplayTitle(module),
        moduleId: module.id,
      })),
    ],
    [visibleWorkspaceModules]
  )
  const fixedProjectDetailsNavigationItem = useMemo(
    () => projectWorkspaceNavigation[0],
    [projectWorkspaceNavigation]
  )
  const sortableProjectWorkspaceNavigation = useMemo(
    () => projectWorkspaceNavigation.slice(1),
    [projectWorkspaceNavigation]
  )
  const projectWorkspaceNavigationIds = useMemo(
    () => projectWorkspaceNavigation.map((item) => item.id),
    [projectWorkspaceNavigation]
  )
  const projectWorkspaceNavigationIdsSignature = useMemo(
    () => projectWorkspaceNavigationIds.join(":"),
    [projectWorkspaceNavigationIds]
  )
  const activeSection =
    manualActiveSection ??
    (projectWorkspaceNavigationIds.includes(observedActiveSection)
      ? observedActiveSection
      : projectWorkspaceNavigationIds[0] ?? "")
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
    handleDraggedModuleOverlayRefChange,
    handleModuleSectionRefChange,
    moduleDropSlotIndex,
    settlingModuleDrop,
    startSharedDrag,
  } = useModuleDnD({
    isDragDisabled: isModuleDragDisabled,
    persistWorkspaceModuleOrder,
    sortedWorkspaceModules,
  })
  const {
    draggedNavItemFrame,
    handleNavItemClick,
    handleDraggedNavItemOverlayRefChange,
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
      pendingNavigationTargetRef.current = null
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

        const pendingNavigationTarget = pendingNavigationTargetRef.current

        if (
          pendingNavigationTimeoutRef.current &&
          pendingNavigationTarget &&
          nextActiveSectionId !== pendingNavigationTarget
        ) {
          return
        }

        if (pendingNavigationTarget && nextActiveSectionId === pendingNavigationTarget) {
          if (pendingNavigationTimeoutRef.current) {
            clearTimeout(pendingNavigationTimeoutRef.current)
            pendingNavigationTimeoutRef.current = null
          }
          pendingNavigationTargetRef.current = null
          setManualActiveSection(null)
        }

        setObservedActiveSection((currentSection) =>
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
  }, [projectWorkspaceNavigationIds, projectWorkspaceNavigationIdsSignature])

  useEffect(() => {
    if (projectWorkspaceNavigationIds.length === 0) {
      setObservedActiveSection("")
      setManualActiveSection(null)
      return
    }

    setObservedActiveSection((currentSection) =>
      projectWorkspaceNavigationIds.includes(currentSection)
        ? currentSection
        : projectWorkspaceNavigationIds[0]
    )
  }, [projectWorkspaceNavigationIds, projectWorkspaceNavigationIdsSignature])

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

  const beginManualSectionSelection = useCallback((targetId: string, durationMs: number) => {
    setManualActiveSection(targetId)

    if (pendingNavigationTimeoutRef.current) {
      clearTimeout(pendingNavigationTimeoutRef.current)
    }

    pendingNavigationTargetRef.current = targetId
    pendingNavigationTimeoutRef.current = setTimeout(() => {
      setManualActiveSection(null)
      pendingNavigationTargetRef.current = null
      pendingNavigationTimeoutRef.current = null
    }, durationMs)
  }, [])

  const shouldScrollSectionIntoView = useCallback((targetElement: HTMLElement) => {
    if (typeof window === "undefined") {
      return false
    }

    const targetBounds = targetElement.getBoundingClientRect()
    const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches
    const preferredTopBoundary = projectSectionAnchorOffsetPx + 36
    const preferredBottomBoundary = Math.max(
      preferredTopBoundary + 1,
      window.innerHeight * (isMobileViewport ? 0.72 : 0.58)
    )

    return (
      targetBounds.top < preferredTopBoundary ||
      targetBounds.top > preferredBottomBoundary
    )
  }, [])

  const selectSection = useCallback((
    targetId: string,
    options?: { href?: string; scroll?: boolean; source: string }
  ) => {
    if (typeof window === "undefined") return

    if (!targetId) return

    const targetElement = observedSectionRefs.current[targetId]

    if (!targetElement) return

    const shouldScroll =
      options?.scroll === true && shouldScrollSectionIntoView(targetElement)

    beginManualSectionSelection(targetId, shouldScroll ? 1500 : 900)

    const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches

    if (options?.href) {
      window.history.replaceState(null, "", options.href)
    }

    if (!shouldScroll) {
      return
    }

    targetElement.scrollIntoView({
      behavior: "smooth",
      block: isMobileViewport ? "start" : "center",
    })
  }, [beginManualSectionSelection, shouldScrollSectionIntoView])

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

  const handleNavigationClick = useCallback((
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    const targetId = href.startsWith("#") ? href.slice(1) : href

    if (!targetId) return

    event.preventDefault()
    selectSection(targetId, { href, scroll: true, source: "nav-click" })
  }, [selectSection])

  const handleSelectSection = useCallback((targetId: string, options?: { scroll?: boolean }) => {
    selectSection(targetId, {
      href: `#${targetId}`,
      scroll: options?.scroll ?? false,
      source: options?.scroll ? "mobile-nav-click" : "main-click",
    })
  }, [selectSection])

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
        mobileProjectNavigation={({ requestClose }) => (
          <div className="space-y-2 py-2">
            <div className="px-3 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-nav-muted)]">
                Current Project
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--theme-nav-foreground)]">
                {currentProject.name}
              </p>
            </div>
            <div className="space-y-2">
              {[fixedProjectDetailsNavigationItem, ...sortableProjectWorkspaceNavigation].map(
                (item) => {
                  const isActive = activeSection === item.id

                  return (
                    <SidebarItem
                      key={item.id}
                      isActive={isActive}
                      onClick={() => {
                        requestClose()
                        requestAnimationFrame(() => {
                          handleSelectSection(item.id, { scroll: true })
                        })
                      }}
                      className="w-full"
                    >
                      {item.label}
                    </SidebarItem>
                  )
                }
              )}
            </div>
          </div>
        )}
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
              navListRef={navListRef}
              settlingModuleDrop={settlingModuleDrop}
              onAddModule={handleOpenAddModuleModal}
              onDraggedNavItemOverlayRefChange={
                handleDraggedNavItemOverlayRefChange
              }
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
                  activeSection={activeSection}
                  activeDragSurface={activeDragSurface}
                  deletingModuleId={deletingModuleId}
                  draggedModuleFrame={draggedModuleFrame}
                  draggedModuleId={draggedModuleId}
                  isCreatingModule={isCreatingModule}
                  isResettingModules={isResettingModules}
                  moduleDropSlotIndex={moduleDropSlotIndex}
                  navDropSlotIndex={navDropSlotIndex}
                  settlingModuleDrop={settlingModuleDrop}
                  moduleError={moduleError}
                  modules={visibleWorkspaceModules}
                  movingModuleId={movingModuleId}
                onAddModule={handleOpenAddModuleModal}
                onDeleteModule={handleDeleteWorkspaceModule}
                onEditModule={handleOpenEditModuleModal}
                onHeaderPointerDown={handleModulePointerDragStart}
                onResetModules={handleResetWorkspaceModules}
                onSelectModule={(module) =>
                  handleSelectSection(getProjectModuleAnchor(module))
                }
                onDraggedModuleOverlayRefChange={
                  handleDraggedModuleOverlayRefChange
                }
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

      <EditProjectModal
        editForm={editForm}
        editProjectFormId={editProjectFormId}
        hasUnsavedChanges={hasEditProjectChanges}
        isOpen={isEditOpen}
        isSaving={isSaving}
        onClose={handleCloseEditProjectModal}
        onSave={() => {
          void handleUpdateProject()
        }}
        saveError={saveError}
        saveFieldErrors={saveFieldErrors}
        setEditForm={setEditForm}
        setSaveFieldErrors={setSaveFieldErrors}
      />

      <EditMetadataModal
        addMetadataField={addMetadataField}
        deleteMetadataField={deleteMetadataField}
        hasUnsavedChanges={hasMetadataChanges}
        isOpen={isMetadataEditOpen}
        isSavingMetadata={isSavingMetadata}
        metadataError={metadataError}
        metadataForm={metadataForm}
        metadataSaveState={metadataSaveState}
        onClose={handleCloseMetadataEditModal}
        onDone={() => {
          void handleDoneEditingProjectMetadata()
        }}
        updateMetadataField={updateMetadataField}
      />

      <EditModuleModal
        clearModuleError={clearModuleError}
        customProjectModuleOptions={customProjectModuleOptions}
        editModuleForm={editModuleForm}
        editModuleFormId={editModuleFormId}
        hasUnsavedChanges={hasEditModuleChanges}
        isOpen={isEditModuleOpen}
        isUpdatingModule={isUpdatingModule}
        moduleError={moduleError}
        onClose={handleCloseEditModuleModal}
        onSave={() => {
          void handleUpdateWorkspaceModule()
        }}
        setEditModuleForm={setEditModuleForm}
      />

      <AddModuleModal
        addModuleFormId={addModuleFormId}
        clearModuleError={clearModuleError}
        createModuleForm={createModuleForm}
        customProjectModuleOptions={customProjectModuleOptions}
        hasUnsavedChanges={hasCreateModuleChanges}
        isCreatingModule={isCreatingModule}
        isOpen={isAddModuleOpen}
        moduleError={moduleError}
        onClose={handleCloseAddModuleModal}
        onCreate={() => {
          void handleCreateWorkspaceModule()
        }}
        setCreateModuleForm={setCreateModuleForm}
      />

      <DeleteProjectModal
        deleteError={deleteError}
        isDeleting={isDeleting}
        isOpen={isDeleteOpen}
        onClose={handleCloseDeleteProjectModal}
        onConfirmDelete={() => {
          void confirmDeleteProject()
        }}
        projectName={currentProject.name}
      />
    </>
  )
}

