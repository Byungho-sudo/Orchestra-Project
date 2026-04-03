"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Project = {
  id: number;
  name: string;
  description: string | null;
  progress: number;
  due_date: string | null;
  created_at: string;
};

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data || []);
      }

      setLoading(false);
    };

    fetchProjects();
  }, []);

  const addProject = async () => {
    if (!name.trim() || !description.trim() || !dueDate.trim()) return;

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

  const deleteProject = async (id: number) => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);
  
    if (error) {
      console.error("Error deleting project:", error);
      return;
    }
  
    setProjects((current) =>
      current.filter((project) => project.id !== id)
    );
  };

  if (loading) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
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

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 md:grid-cols-[240px_1fr]">
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

        <main className="space-y-4">
          <h2 className="text-xl font-semibold">Project Cards</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold">{project.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="mt-3 text-sm font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Due {project.due_date ?? "No due date"}
                </p>

                <div className="mt-4 space-y-4">
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
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>

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
    </div>
  );
}