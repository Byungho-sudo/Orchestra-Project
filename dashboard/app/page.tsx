"use client";

/**
 * Main dashboard page for Orchestra Project.
 *
 * Current responsibilities:
 * - Fetch projects from Supabase
 * - Display project cards
 * - Create new projects
 * - Edit existing projects
 * - Delete existing projects
 * - Confirm destructive delete actions
 * - Display loading, empty, and error states
 *
 * CRUD status:
 * - Create: implemented
 * - Read: implemented
 * - Update: implemented
 * - Delete: implemented
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation"

/**
 * Type definition for a project row coming from Supabase.
 */
type Project = {
  id: number;
  name: string;
  description: string | null;
  progress: number;
  due_date: string | null;
  created_at: string;
};

export default function Home() {
  /**
   * Controls the visibility of the "New Project" modal.
   */
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Controls the visibility of the "Edit Project" modal.
   */
  const [isEditOpen, setIsEditOpen] = useState(false);

  /**
   * Controls the visibility of the delete confirmation modal.
   */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  /**
   * Stores all loaded projects.
   */
  const [projects, setProjects] = useState<Project[]>([]);

  /**
   * Tracks the loading state while fetching data from Supabase.
   */
  const [loading, setLoading] = useState(true);

  /**
   * Stores a fetch/create/update/delete error message for display.
   */
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Stores the currently selected project for editing.
   */
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  /**
   * Stores the currently selected project for deletion.
   */
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  /**
   * Controlled form state for the "New Project" modal.
   */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  /**
   * Controlled form state for the "Edit Project" modal.
   */
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const router = useRouter()

  /**
   * Fetch all projects when the page first loads.
   */
  useEffect(() => {
    const fetchProjects = async () => {
      setErrorMessage("");

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        setErrorMessage("Failed to load projects. Please try again.");
      } else {
        setProjects(data || []);
      }

      setLoading(false);
    };

    fetchProjects();
  }, []);

  /**
   * Create a new project in Supabase and immediately update local state.
   */
  const addProject = async () => {
    if (!name.trim() || !description.trim() || !dueDate.trim()) return;

    setErrorMessage("");

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name: name.trim(),
          description: description.trim(),
          due_date: dueDate,
          progress: 0,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating project:", error);
      setErrorMessage("Failed to create project. Please try again.");
      return;
    }

    if (data) {
      setProjects((current) => [...data, ...current]);
    }

    setName("");
    setDescription("");
    setDueDate("");
    setIsOpen(false);
  };

  /**
   * Open the edit modal and pre-fill it with the selected project's data.
   */
  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditDueDate(project.due_date ?? "");
    setIsEditOpen(true);
  };

  /**
   * Update an existing project in Supabase and synchronize local state.
   */
  const updateProject = async () => {
    if (!editingProject) return;
    if (!editName.trim() || !editDescription.trim() || !editDueDate.trim()) return;

    setErrorMessage("");

    const { data, error } = await supabase
      .from("projects")
      .update({
        name: editName.trim(),
        description: editDescription.trim(),
        due_date: editDueDate,
      })
      .eq("id", editingProject.id)
      .select();

    if (error) {
      console.error("Error updating project:", error);
      setErrorMessage("Failed to update project. Please try again.");
      return;
    }

    if (data) {
      setProjects((current) =>
        current.map((project) =>
          project.id === editingProject.id ? data[0] : project
        )
      );
    }

    closeEditModal();
  };

  /**
   * Close the edit modal and clear edit state.
   */
  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingProject(null);
    setEditName("");
    setEditDescription("");
    setEditDueDate("");
  };

  /**
   * Open the delete confirmation modal.
   */
  const openDeleteModal = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteOpen(true);
  };

  /**
   * Close the delete confirmation modal and clear selected project.
   */
  const closeDeleteModal = () => {
    setProjectToDelete(null);
    setIsDeleteOpen(false);
  };

  /**
   * Delete a project from Supabase and remove it from local state.
   */
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    setErrorMessage("");

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectToDelete.id);

    if (error) {
      console.error("Error deleting project:", error);
      setErrorMessage("Failed to delete project. Please try again.");
      return;
    }

    setProjects((current) =>
      current.filter((project) => project.id !== projectToDelete.id)
    );

    closeDeleteModal();
  };

  /**
   * Show a loading screen while data is being fetched.
   */
  if (loading) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
          <h1 className="text-lg font-semibold">Project Dashboard</h1>
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            New Project
          </button>
        </div>
      </header>

      {/* Dashboard layout */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Sidebar
          </h2>

          <nav className="space-y-2 text-sm">
            <a className="block rounded-md bg-indigo-50 px-3 py-2 font-medium text-indigo-700">
              Overview
            </a>
            <a className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
              Projects
            </a>
            <a className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
              Team
            </a>
            <a className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
              Reports
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="space-y-4">
          <h2 className="text-xl font-semibold">Project Cards</h2>

          {/* Error state */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Empty state */}
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

          {/* Project grid */}
          {projects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <h3 className="text-base font-semibold">{project.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {project.description}
                  </p>

                  <div className="mt-4 space-y-4">
                    {/* Progress bar */}
                    <div>
                      <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                        <span>Progress Bar</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Placeholder deadline bar */}
                    <div>
                      <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                        <span>Deadline Bar</span>
                        <span>5% used</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-rose-500"
                          style={{ width: "5%" }}
                        />
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Due {project.due_date ?? "No due date"}
                    </p>
                    {/* Action buttons */}
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(project)
                        }}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteModal(project)
                        }}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* New Project modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">New Project</h3>
            <p className="mt-1 text-sm text-slate-600">
              Add a new project card to the dashboard.
            </p>

            <div className="mt-4 space-y-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Project name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Project description"
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={addProject}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Edit Project</h3>
            <p className="mt-1 text-sm text-slate-600">
              Update this project&apos;s information.
            </p>

            <div className="mt-4 space-y-3">
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="Project name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              />
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder="Project description"
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              />
              <input
                type="date"
                value={editDueDate}
                onChange={(event) => setEditDueDate(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeEditModal}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={updateProject}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {isDeleteOpen && projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Delete Project
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {projectToDelete.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeDeleteModal}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}