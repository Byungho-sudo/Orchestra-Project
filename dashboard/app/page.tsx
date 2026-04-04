"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/app/components/project-dashboard/DashboardHeader"
import { DashboardSidebar } from "@/app/components/project-dashboard/DashboardSidebar"
import { DeleteProjectModal } from "@/app/components/project-dashboard/DeleteProjectModal"
import { EditProjectModal } from "@/app/components/project-dashboard/EditProjectModal"
import { NewProjectModal } from "@/app/components/project-dashboard/NewProjectModal"
import { ProjectCard } from "@/app/components/project-dashboard/ProjectCard"
import { ProjectToolbar } from "@/app/components/project-dashboard/ProjectToolbar"
import type { DeadlineFilter } from "@/lib/project-deadline"
import {
  filterProjects,
  sortProjects,
  type Project,
  type ProjectVisibility,
  type SortOption,
} from "@/lib/projects"
import {
  validateProjectForm,
  type ProjectFormErrors,
} from "@/lib/project-validation"
import { supabase } from "@/lib/supabase"
import { useCurrentUser } from "@/lib/use-current-user"

export default function Home() {
  const router = useRouter()
  const { currentUser, logout } = useCurrentUser()

  const [isOpen, setIsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [visibility, setVisibility] = useState<ProjectVisibility>("public")
  const [newProjectErrors, setNewProjectErrors] = useState<ProjectFormErrors>(
    {}
  )

  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDueDate, setEditDueDate] = useState("")
  const [editProjectErrors, setEditProjectErrors] = useState<ProjectFormErrors>(
    {}
  )

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window === "undefined") return "due_date"

    return (localStorage.getItem("sortBy") as SortOption) || "due_date"
  })

  const [searchQuery, setSearchQuery] = useState("")

  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>(() => {
    if (typeof window === "undefined") return "All"

    return (localStorage.getItem("deadlineFilter") as DeadlineFilter) || "All"
  })

  const filteredProjects = filterProjects(
    projects,
    searchQuery,
    deadlineFilter
  )
  const sortedProjects = sortProjects(filteredProjects, sortBy)

  useEffect(() => {
    const fetchProjects = async () => {
      setErrorMessage("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const query = supabase.from("projects").select("*")
      const { data, error } = user
        ? await query
            .or(`visibility.eq.public,user_id.eq.${user.id}`)
            .order("due_date", { ascending: true })
        : await query
            .eq("visibility", "public")
            .order("due_date", { ascending: true })

      if (error) {
        console.error("Supabase error:", error)
        console.error("message:", error?.message)
        console.error("details:", error?.details)
        console.error("hint:", error?.hint)
        setErrorMessage("Failed to load projects. Please try again.")
      } else {
        setProjects(data || [])
      }

      setLoading(false)
    }

    fetchProjects()
  }, [])

  useEffect(() => {
    localStorage.setItem("deadlineFilter", deadlineFilter)
  }, [deadlineFilter])

  useEffect(() => {
    localStorage.setItem("sortBy", sortBy)
  }, [sortBy])

  const addProject = async () => {
    setErrorMessage("")

    const validation = validateProjectForm(
      {
        name,
        description,
        due_date: dueDate,
        progress: 0,
        visibility,
      },
      Boolean(currentUser)
    )

    setNewProjectErrors(validation.errors)

    if (!validation.isValid) return

    setIsSavingProject(true)

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name: validation.values.name,
          description: validation.values.description,
          due_date: validation.values.due_date,
          progress: 0,
          user_id: currentUser?.id ?? null,
          visibility: validation.values.visibility,
        },
      ])
      .select()

    setIsSavingProject(false)

    if (error) {
      console.error("Error creating project:", error)
      setErrorMessage("Failed to create project. Please try again.")
      return
    }

    if (data) {
      setProjects((current) => [...current, ...data])
    }

    setName("")
    setDescription("")
    setDueDate("")
    setVisibility("public")
    setNewProjectErrors({})
    setIsOpen(false)
  }

  const openEditModal = (project: Project) => {
    setEditingProject(project)
    setEditName(project.name)
    setEditDescription(project.description ?? "")
    setEditDueDate(project.due_date ?? "")
    setEditProjectErrors({})
    setIsEditOpen(true)
  }

  const updateProject = async () => {
    if (!editingProject) return

    setErrorMessage("")

    const validation = validateProjectForm(
      {
        name: editName,
        description: editDescription,
        due_date: editDueDate,
        visibility: editingProject.visibility,
      },
      editingProject.visibility === "private" || Boolean(currentUser)
    )

    setEditProjectErrors(validation.errors)

    if (!validation.isValid) return

    setIsSavingProject(true)

    const { data, error } = await supabase
      .from("projects")
      .update({
        name: validation.values.name,
        description: validation.values.description,
        due_date: validation.values.due_date,
      })
      .eq("id", editingProject.id)
      .select()

    setIsSavingProject(false)

    if (error) {
      console.error("Error updating project:", error)
      setErrorMessage("Failed to update project. Please try again.")
      return
    }

    if (data) {
      setProjects((current) =>
        current.map((project) =>
          project.id === editingProject.id ? data[0] : project
        )
      )
    }

    closeEditModal()
  }

  const closeEditModal = () => {
    setIsEditOpen(false)
    setEditingProject(null)
    setEditName("")
    setEditDescription("")
    setEditDueDate("")
    setEditProjectErrors({})
  }

  const openDeleteModal = (project: Project) => {
    setProjectToDelete(project)
    setIsDeleteOpen(true)
  }

  const closeDeleteModal = () => {
    setProjectToDelete(null)
    setIsDeleteOpen(false)
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return

    setErrorMessage("")

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectToDelete.id)

    if (error) {
      console.error("Error deleting project:", error)
      setErrorMessage("Failed to delete project. Please try again.")
      return
    }

    setProjects((current) =>
      current.filter((project) => project.id !== projectToDelete.id)
    )

    closeDeleteModal()
  }

  if (loading) {
    return <div className="p-6">Loading projects...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardHeader
        currentUser={currentUser}
        onLogout={logout}
        onCreateProject={() => setIsOpen(true)}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 md:grid-cols-[240px_1fr]">
        <DashboardSidebar />

        <main className="space-y-4">
          <ProjectToolbar
            searchQuery={searchQuery}
            deadlineFilter={deadlineFilter}
            sortBy={sortBy}
            onSearchQueryChange={setSearchQuery}
            onDeadlineFilterChange={setDeadlineFilter}
            onSortByChange={setSortBy}
          />

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          {!errorMessage && projects.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                No projects yet
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Create your first project to start building your dashboard.
              </p>
              <button
                onClick={() => setIsOpen(true)}
                className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Create First Project
              </button>
            </div>
          )}

          {!errorMessage &&
            projects.length > 0 &&
            sortedProjects.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  No matching projects
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {searchQuery.trim()
                    ? "No projects match your current search."
                    : "No projects match your selected deadline filter."}
                </p>
              </div>
            )}

          {sortedProjects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpenProject={() => router.push(`/projects/${project.id}`)}
                  onEditProject={() => openEditModal(project)}
                  onDeleteProject={() => openDeleteModal(project)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {isOpen && (
        <NewProjectModal
          name={name}
          description={description}
          dueDate={dueDate}
          visibility={visibility}
          canCreatePrivate={Boolean(currentUser)}
          errors={newProjectErrors}
          isSaving={isSavingProject}
          onNameChange={(value) => {
            setName(value)
            setNewProjectErrors((current) => ({ ...current, name: undefined }))
          }}
          onDescriptionChange={(value) => {
            setDescription(value)
            setNewProjectErrors((current) => ({
              ...current,
              description: undefined,
            }))
          }}
          onDueDateChange={(value) => {
            setDueDate(value)
            setNewProjectErrors((current) => ({
              ...current,
              due_date: undefined,
            }))
          }}
          onVisibilityChange={(value) => {
            setVisibility(value)
            setNewProjectErrors((current) => ({
              ...current,
              visibility: undefined,
            }))
          }}
          onCancel={() => {
            setIsOpen(false)
            setNewProjectErrors({})
          }}
          onCreateProject={addProject}
        />
      )}

      {isEditOpen && (
        <EditProjectModal
          editName={editName}
          editDescription={editDescription}
          editDueDate={editDueDate}
          errors={editProjectErrors}
          isSaving={isSavingProject}
          onEditNameChange={(value) => {
            setEditName(value)
            setEditProjectErrors((current) => ({
              ...current,
              name: undefined,
            }))
          }}
          onEditDescriptionChange={(value) => {
            setEditDescription(value)
            setEditProjectErrors((current) => ({
              ...current,
              description: undefined,
            }))
          }}
          onEditDueDateChange={(value) => {
            setEditDueDate(value)
            setEditProjectErrors((current) => ({
              ...current,
              due_date: undefined,
            }))
          }}
          onCancel={closeEditModal}
          onSaveProject={updateProject}
        />
      )}

      {isDeleteOpen && projectToDelete && (
        <DeleteProjectModal
          projectName={projectToDelete.name}
          onCancel={closeDeleteModal}
          onConfirmDelete={confirmDeleteProject}
        />
      )}
    </div>
  )
}
