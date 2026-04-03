"use client";

import { useState } from "react";

type Project = {
  id: number;
  name: string;
  description: string;
  progress: number;
  deadlineUsed: number;
  dueDate: string;
};

const initialProjects: Project[] = [
  {
    id: 1,
    name: "Mobile App Redesign",
    description: "Refresh user flows and improve onboarding conversion.",
    progress: 72,
    deadlineUsed: 65,
    dueDate: "Apr 28, 2026",
  },
  {
    id: 2,
    name: "Marketing Website",
    description: "Launch performance-focused landing pages and CMS content.",
    progress: 46,
    deadlineUsed: 34,
    dueDate: "May 12, 2026",
  },
  {
    id: 3,
    name: "Analytics Dashboard",
    description: "Expose KPIs by team and automate weekly executive reports.",
    progress: 87,
    deadlineUsed: 90,
    dueDate: "Apr 9, 2026",
  },
];

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const addProject = () => {
    if (!name.trim() || !description.trim() || !dueDate.trim()) return;

    setProjects((current) => [
      ...current,
      {
        id: Date.now(),
        name: name.trim(),
        description: description.trim(),
        progress: 0,
        deadlineUsed: 5,
        dueDate,
      },
    ]);

    setName("");
    setDescription("");
    setDueDate("");
    setIsOpen(false);
  };

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
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Due {project.dueDate}
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
                      <span>{project.deadlineUsed}% used</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${project.deadlineUsed}%` }}
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
