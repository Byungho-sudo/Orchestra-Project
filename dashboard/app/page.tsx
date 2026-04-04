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
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
  owner_id: string | null;
  is_public: boolean;
};

type SortOption = "due_date" | "created_at" | "name" | "progress";
type DeadlineFilter = "All" | "Overdue" | "Due today" | "Due soon" | "No deadline";
type VisibilityOption = "public" | "private";

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
   * Stores the currently authenticated Supabase user session.
   */
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
  const [visibility, setVisibility] = useState<VisibilityOption>("public");

  /**
   * Controlled form state for the "Edit Project" modal.
   */
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  /**
   * Controls dashboard sorting.
   */
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window === "undefined") return "due_date";

    return (localStorage.getItem("sortBy") as SortOption) || "due_date";
  });

  /**
   * Controls client-side project search by name.
   */
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Controls client-side filtering by deadline status.
   */
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>(() => {
    if (typeof window === "undefined") return "All";

    return (localStorage.getItem("deadlineFilter") as DeadlineFilter) || "All";
  });

  const router = useRouter();

  /**
   * Sort projects based on the selected sort option.
   */
  const sortProjects = (projectList: Project[]) => {
    return [...projectList].sort((a, b) => {
      switch (sortBy) {
        case "due_date": {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        }

        case "created_at":
          return b.created_at.localeCompare(a.created_at);

        case "name":
          return a.name.localeCompare(b.name);

        case "progress":
          return b.progress - a.progress;

        default:
          return 0;
      }
    });
  };

  /**
   * Calculate a readable deadline status from a project's due date.
   */
  const getDeadlineStatus = (dueDate: string | null) => {
    if (!dueDate) return "No deadline";

    const [year, month, day] = dueDate.split("-").map(Number);
    const dueAt = Date.UTC(year, month - 1, day);
    const today = new Date();
    const todayAt = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const daysUntilDue = Math.round(
      (dueAt - todayAt) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue < 0) return "Overdue";
    if (daysUntilDue === 0) return "Due today";
    if (daysUntilDue <= 7) return "Due soon";
    return `Due in ${daysUntilDue} days`;
  };

  const getDeadlineBadgeClass = (status: string) => {
    if (status === "Overdue") return "bg-red-100 text-red-700";
    if (status === "Due today") return "bg-orange-100 text-orange-700";
    if (status === "Due soon") return "bg-yellow-100 text-yellow-800";
    if (status === "No deadline") return "bg-slate-100 text-slate-600";
    return "bg-blue-100 text-blue-700";
  };

  const getDeadlineBarClass = (status: string) => {
    if (status === "Overdue") return "bg-red-700";
    if (status === "Due today") return "bg-orange-600";
    if (status === "Due soon") return "bg-amber-500";
    if (status === "No deadline") return "bg-gray-400";
    return "bg-blue-700";
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) &&
    (deadlineFilter === "All" ||
      getDeadlineStatus(project.due_date) === deadlineFilter)
  );

  const getDeadlineFill = (dueDate: string | null) => {
    if (!dueDate) return 0;

    const [year, month, day] = dueDate.split("-").map(Number);
    const dueAt = Date.UTC(year, month - 1, day);
    const today = new Date();
    const todayAt = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const daysUntilDue = Math.round(
      (dueAt - todayAt) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue <= 0) return 100;
    if (daysUntilDue <= 3) return 90;
    if (daysUntilDue <= 7) return 75;
    if (daysUntilDue <= 14) return 45;
    if (daysUntilDue <= 30) return 20;
    return 5;
  };

  /**
   * Fetch all projects when the page first loads.
   */
  useEffect(() => {
    const fetchProjects = async () => {
      setErrorMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const query = supabase.from("projects").select("*");
      const { data, error } = user
        ? await query
            .or(`visibility.eq.public,user_id.eq.${user.id}`)
            .order("due_date", { ascending: true })
        : await query
            .eq("visibility", "public")
            .order("due_date", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        console.error("message:", error?.message);
        console.error("details:", error?.details);
        console.error("hint:", error?.hint);
        setErrorMessage("Failed to load projects. Please try again.");
      } else {
        setProjects(data || []);
      }

      setLoading(false);
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    localStorage.setItem("deadlineFilter", deadlineFilter);
  }, [deadlineFilter]);

  useEffect(() => {
    localStorage.setItem("sortBy", sortBy);
  }, [sortBy]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user);
    };

    loadCurrentUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
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
          user_id: currentUser?.id ?? null,
          visibility,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating project:", error);
      setErrorMessage("Failed to create project. Please try again.");
      return;
    }

    if (data) {
      setProjects((current) => [...current, ...data]);
    }

    setName("");
    setDescription("");
    setDueDate("");
    setVisibility("public");
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

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push("/login");
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
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <span className="hidden text-sm text-slate-600 sm:inline">
                  {currentUser.email}
                </span>
                <button
                  onClick={logout}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:underline"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Sign up
                </Link>
              </>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              New Project
            </button>
          </div>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Project Cards</h2>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center text-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 sm:w-56"
              />

              <div className="flex items-center gap-2">
                <select
                  value={deadlineFilter}
                  onChange={(event) =>
                    setDeadlineFilter(event.target.value as DeadlineFilter)
                  }
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Due today">Due today</option>
                  <option value="Due soon">Due soon</option>
                  <option value="No deadline">No deadline</option>
                </select>

                <span className="text-slate-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as SortOption)
                  }
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="due_date">Due date</option>
                  <option value="created_at">Created date</option>
                  <option value="name">Name</option>
                  <option value="progress">Progress</option>
                </select>
              </div>
            </div>
          </div>

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

          {/* No results state */}
          {!errorMessage && projects.length > 0 && filteredProjects.length === 0 && (
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

          {/* Project grid */}
          {filteredProjects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortProjects(filteredProjects).map((project) => (
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
                          className="h-full rounded-full bg-green-700"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Placeholder deadline bar */}
                    <div>
                      <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                        <span>Deadline Bar</span>
                        <span>{getDeadlineStatus(project.due_date)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${getDeadlineBarClass(
                            getDeadlineStatus(project.due_date)
                          )}`}
                          style={{ width: `${getDeadlineFill(project.due_date)}%` }}
                        />
                      </div>
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Due {project.due_date ?? "No due date"}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal ${getDeadlineBadgeClass(
                          getDeadlineStatus(project.due_date)
                        )}`}
                      >
                        {getDeadlineStatus(project.due_date)}
                      </span>
                    </p>

                    {/* Action buttons */}
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(project);
                        }}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(project);
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
              <select
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as VisibilityOption)
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-500 focus:ring-2"
              >
                <option value="public">Public</option>
                <option value="private" disabled={!currentUser}>
                  Private
                </option>
              </select>
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
