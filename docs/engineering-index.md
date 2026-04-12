# Orchestra Project Engineering Index

## Overview

Orchestra Project is a small full-stack project workspace app. It lets users create projects, browse them in a dashboard, open a project detail page, edit workspace fields, manage ordered workspace modules, and track project tasks.

The codebase is practical rather than heavily abstracted. Most of the app logic lives in a few client components, especially the project list and project detail screens.

## Tech Stack

- Frontend: Next.js 15 App Router, React 19, TypeScript
- Styling: Tailwind CSS v4 plus a small global stylesheet
- Backend/data API: Supabase JS via `@supabase/ssr`
- Database: PostgreSQL on Supabase
- Auth: Supabase Auth email/password and email confirmation flow
- Tooling: ESLint, TypeScript, Next build pipeline
- Hosting: Vercel is referenced in the root README, but deployment config is not stored in this repo

## High-Level Architecture

At a high level, the system is:

1. A Next.js app inside `web/`
2. A Supabase-backed data model centered on `public.projects`
3. A project detail screen that reads and writes three related database concepts:
   - the base project row in `public.projects`
   - ordered center-column modules in `public.project_modules`
   - task items in `public.project_tasks`

The app uses:

- A browser Supabase client for most interactive reads and writes
- A server Supabase client for server-rendered project detail loading
- Middleware to require login for `/projects/*`

Important reality of the current code:

- Some screens still support anonymous/public data access in their queries
- But `web/middleware.ts` currently redirects all `/projects/*` routes to `/login`
- That means the code and route protection are slightly out of sync conceptually

## Repository Layout

### Root

- `README.md`
  The broader project summary. It is more product-facing than code-facing and is a little behind the current implementation.
- `docs/`
  Repository-level documentation.
- `supabase/`
  A root-level migration folder currently containing only the unique module order index migration.
- `web/`
  The actual Next.js application and the main Supabase migration history used by the app.

### `web/`

- `app/`
  Next.js App Router pages and UI components.
- `lib/`
  Shared helpers, client/server Supabase setup, validation, types, and project module defaults.
- `supabase/`
  SQL migrations and a backfill script related to the app’s schema.
- `public/`
  Static assets from the Next starter template.
- `package.json`
  App scripts and dependencies.
- `middleware.ts`
  Route protection for `/projects/*`.

## Folder-by-Folder Breakdown

### `web/app`

This is the main application UI.

- `layout.tsx`
  Root HTML shell and fonts.
- `page.tsx`
  Redirects `/` to `/dashboard`.
- `web/page.tsx`
  Overview screen with metrics and recent projects.
- `projects/page.tsx`
  Projects index route.
- `projects/ProjectsPageClient.tsx`
  Wraps the projects page in `AppShell` and owns the create-project modal open state.
- `projects/[id]/page.tsx`
  Server component that loads a project row and renders the detail client.
- `projects/[id]/ProjectDetailClient.tsx`
  The largest and most behavior-heavy file in the repo. It handles project editing, workspace editing, module CRUD/reordering/reset, task CRUD/toggling/due dates, and project deletion.
- `login/page.tsx`, `signup/page.tsx`, `auth/callback/page.tsx`
  Supabase Auth flow.
- `team/page.tsx`, `reports/page.tsx`
  Placeholder top-level sections.
- `components/project-web/*`
  Shared dashboard shell and project page UI pieces.

### `web/lib`

This folder contains the shared logic layer.

- `supabase.ts`
  Browser Supabase client.
- `supabase-server.ts`
  Server Supabase client using Next cookies.
- `supabase-config.ts`
  Reads public Supabase environment variables.
- `projects.ts`
  Shared TypeScript shapes for `Project` and `ProjectTask`, plus project filtering/sorting helpers.
- `project-validation.ts`
  Validates project form input before writes.
- `project-deadline.ts`
  Deadline status and badge/progress helpers used in cards and detail views.
- `project-modules.ts`
  Source of truth for the default starter modules and their default order.
- `use-current-user.ts`
  Small client auth hook based on Supabase session state.
- `auth-redirect.ts`
  Sanitizes `next=` redirect parameters for auth pages.

### `web/supabase`

This is the main schema history for the app.

- `migrations/`
  SQL migrations for project status, workspace fields, tasks, modules, and the project creation RPC.
- `backfills/`
  One-off SQL to backfill default project modules.

### Root `supabase/`

- `migrations/20260405_add_unique_order_index_to_project_modules.sql`
  A root-level migration that adds a unique `(project_id, "order")` index.

This split between `web/supabase` and root `supabase` is worth noting. A contributor should check which migration path is actually applied in the deployment workflow before adding more DB changes.

## Most Important Files

### App entry and layout

- `web/app/layout.tsx`
  Defines the root HTML structure and imports `globals.css`.
- `web/app/page.tsx`
  Immediately redirects to `/dashboard`.
- `web/app/globals.css`
  Global CSS, cursor defaults, and theme variables.

### Shell and navigation

- `web/app/components/project-web/AppShell.tsx`
  Shared page frame with top header and left sidebar.
- `web/app/components/project-web/DashboardHeader.tsx`
  Top navigation area, auth buttons, and optional “New Project” action.
- `web/app/components/project-web/DashboardSidebar.tsx`
  Left-side route navigation for Overview, Projects, Team, and Reports.

### Project list flow

- `web/app/projects/ProjectsPageClient.tsx`
  Connects the shell and the project grid.
- `web/app/components/project-web/ProjectsGrid.tsx`
  Fetches projects, filters/sorts them, opens the create modal, and creates projects.
- `web/app/components/project-web/NewProjectModal.tsx`
  Pure create-project form UI.
- `web/app/components/project-web/ProjectCard.tsx`
  Individual project summary card used in lists.
- `web/app/components/project-web/ProjectToolbar.tsx`
  Search, deadline filter, and sorting controls.

### Project detail flow

- `web/app/projects/[id]/page.tsx`
  Server fetch for a single project and error/not-found states.
- `web/app/projects/[id]/ProjectDetailClient.tsx`
  Main project workspace UI and almost all detail-page behavior.

### Supabase connection

- `web/lib/supabase.ts`
  Browser client for client components.
- `web/lib/supabase-server.ts`
  Server client for server components.
- `web/middleware.ts`
  Uses a server Supabase client to protect `/projects/*`.

### Data and defaults

- `web/lib/projects.ts`
  Type definitions for project rows and task rows as the UI expects them.
- `web/lib/project-modules.ts`
  Default starter module list:
  `Workspace Plan`, `Planning / Operations`, `Tasks / Next Steps`, `Timeline`, `Assets`

### Database migrations

- `web/supabase/migrations/202604040003_create_project_tasks.sql`
  Creates `public.project_tasks` and its RLS policies.
- `web/supabase/migrations/202604040007_create_project_modules.sql`
  Creates `public.project_modules` and its RLS policies.
- `web/supabase/migrations/202604040008_allow_default_project_module_types.sql`
  Expands allowed module types to include the default workspace modules.
- `web/supabase/migrations/202604050001_create_project_with_default_modules.sql`
  Creates the RPC used by project creation.

## Routing

The app uses the Next.js App Router under `web/app`.

Current top-level routes:

- `/`
  Redirects to `/dashboard`
- `/dashboard`
  Dashboard overview
- `/projects`
  Projects list page
- `/projects/[id]`
  Project detail page
- `/login`
  Login page
- `/signup`
  Signup page
- `/auth/callback`
  Email confirmation / auth callback handler
- `/team`
  Placeholder page
- `/reports`
  Placeholder page

Route protection:

- `web/middleware.ts` matches `/projects/:path*`
- If there is no Supabase user session, it redirects to `/login?next=...`

Practical effect:

- The code in `ProjectsGrid.tsx` and `web/page.tsx` can query public projects for anonymous users
- But middleware prevents anonymous users from visiting `/projects` and `/projects/[id]`
- `/dashboard` remains accessible

## How Project Creation Works

Project creation currently starts in:

- `web/app/components/project-web/ProjectsGrid.tsx`

Flow:

1. User opens the modal from the header or empty state
2. `NewProjectModal.tsx` collects name, description, due date, and visibility
3. `validateProjectForm()` in `web/lib/project-validation.ts` normalizes and validates the values
4. The client calls Supabase RPC `create_project_with_default_modules`
5. That RPC inserts into `public.projects`
6. The same RPC immediately inserts the five default starter rows into `public.project_modules`
7. The new project is appended to local state in the grid

Why this matters:

- The intended architecture is now eager initialization
- A project is treated as fully created only if its module rows are created too

The SQL for the RPC lives in:

- `web/supabase/migrations/202604050001_create_project_with_default_modules.sql`

## How Project Modules Work

`public.project_modules` is the source of truth for the center workspace structure on the detail page.

Default modules are defined in:

- `web/lib/project-modules.ts`

Default order:

1. `workspace_plan`
2. `planning_operations`
3. `tasks`
4. `timeline`
5. `assets`

Runtime behavior on the detail page:

- `ProjectDetailClient.tsx` loads `project_modules` for the current project
- If rows exist, it sorts and normalizes them by `order`
- If no rows exist, it still contains fallback logic to insert the default module set
- Users can add custom modules (`notes`, `checklist`, `metrics`, `links`)
- Users can delete, reorder, and reset modules

Important current detail:

- The app still contains “repair” behavior in `loadWorkspaceModules()` that seeds defaults if no rows exist
- That is now a safety fallback, not the intended primary creation path

Important database rule:

- The repo now includes a unique index on `(project_id, "order")`
- That means a project should not have two modules with the same order value

## How Tasks Work

Tasks are stored in `public.project_tasks`, not in the legacy `projects.tasks` JSON column.

Current task behavior lives almost entirely in:

- `web/app/projects/[id]/ProjectDetailClient.tsx`

Supported task actions:

- Create task
- Toggle completed state
- Set or clear due date
- Delete task with a short undo window

Important current detail:

- `public.projects` still has a `tasks jsonb` column from `202604040002_add_project_workspace_fields.sql`
- The UI does not appear to use that field anymore
- The real active task model is `public.project_tasks`

## How Supabase Is Connected

### Browser client

- `web/lib/supabase.ts`

Used by client components for:

- auth actions
- project list fetches
- project updates
- task writes
- module writes
- RPC calls

### Server client

- `web/lib/supabase-server.ts`

Used by server components and middleware. It reads and writes cookies through Next APIs.

### Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Current note:

- The server client also uses the publishable key, not a service-role key
- So server-side data access still depends on user session + RLS, not elevated admin access

## Main Database Tables

### `public.projects`

Primary project record.

Based on the UI and migrations, important fields are:

- `id`
- `name`
- `description`
- `progress`
- `due_date`
- `created_at`
- `user_id`
- `visibility`
- `status`
- workspace text fields such as `intention`, `idea`, `target_buyer`, `product`, `price`, `tools`, `supplier`, `budget`, `notes`
- `tasks` JSON column, which now looks legacy

### `public.project_modules`

Ordered modules for the project detail center workspace.

Fields defined in migrations:

- `id uuid`
- `project_id bigint`
- `title text`
- `type text`
- `"order" integer`
- `created_at timestamptz`

### `public.project_tasks`

Normalized task records attached to a project.

Fields from migrations:

- `id bigserial`
- `project_id bigint`
- `text text`
- `completed boolean`
- `created_at timestamptz`
- `due_date timestamptz`
- `completed_at timestamptz`

## Table Relationships

The key relationships are:

- One `projects` row can have many `project_modules`
- One `projects` row can have many `project_tasks`
- `project_modules.project_id` references `projects.id`
- `project_tasks.project_id` references `projects.id`
- Both child tables use `on delete cascade`

In practice:

- Deleting a project should also delete its modules and tasks at the database level

## How the UI Layout Is Structured

Top-level screens such as `/dashboard`, `/projects`, `/team`, and `/reports` use:

- `AppShell`
  - `DashboardHeader`
  - `DashboardSidebar`
  - page-specific main content

The project detail page is different:

- It does not use `AppShell`
- It uses its own three-column layout inside `ProjectDetailClient.tsx`
  - left: in-page anchor navigation
  - center: ordered project modules
  - right: project context and actions

This means editing top-level shell/navigation is usually separate from editing the project detail experience.

## Safe Files to Edit for Common Tasks

These are generally the safest places to work when the task is local and well-scoped.

### Add or adjust project list UI

- `web/app/components/project-web/ProjectCard.tsx`
- `web/app/components/project-web/ProjectToolbar.tsx`
- `web/app/components/project-web/NewProjectModal.tsx`
- `web/app/components/project-web/ProjectsGridSkeleton.tsx`

### Adjust top-level shell or navigation

- `web/app/components/project-web/AppShell.tsx`
- `web/app/components/project-web/DashboardHeader.tsx`
- `web/app/components/project-web/DashboardSidebar.tsx`

### Update validation or display helpers

- `web/lib/project-validation.ts`
- `web/lib/project-deadline.ts`
- `web/lib/projects.ts`
- `web/lib/project-modules.ts`

### Add or change documentation

- `docs/`
- `README.md`

## Files to Change Carefully

These files are central and easy to break.

- `web/app/projects/[id]/ProjectDetailClient.tsx`
  This file contains a large amount of stateful behavior and mixed concerns.
- `web/app/components/project-web/ProjectsGrid.tsx`
  This is the main project list and creation flow.
- `web/middleware.ts`
  Small file, large impact on route access.
- `web/lib/supabase-server.ts`
  Cookie behavior here affects auth/session behavior broadly.
- `web/supabase/migrations/*`
  Schema changes ripple into UI assumptions quickly.

Also change carefully:

- `web/lib/projects.ts`
  These types are used widely and reflect database/UI expectations.

## Read This First: Onboarding Path

For a new contributor, this is the fastest useful reading order:

1. `README.md`
   Quick product context, but treat it as partially outdated.
2. `web/package.json`
   Confirms stack and scripts.
3. `web/app/page.tsx`
   Shows the app root redirect.
4. `web/app/components/project-web/AppShell.tsx`
   Explains the shared page frame.
5. `web/app/components/project-web/ProjectsGrid.tsx`
   Best first file for understanding the main CRUD flow.
6. `web/lib/projects.ts`
   Shared shapes for project/task data.
7. `web/lib/project-modules.ts`
   Default module source of truth.
8. `web/app/projects/[id]/page.tsx`
   Shows how the detail route is loaded.
9. `web/app/projects/[id]/ProjectDetailClient.tsx`
   Main detail page behavior.
10. `web/supabase/migrations/202604040003_create_project_tasks.sql`
11. `web/supabase/migrations/202604040007_create_project_modules.sql`
12. `web/supabase/migrations/202604050001_create_project_with_default_modules.sql`

## Current Known Limitations and Likely Next Areas

### Known limitations

- `ProjectDetailClient.tsx` is very large and mixes presentation, fetch logic, mutation logic, and state management.
- There is likely legacy transition code still present:
  - hidden old markup blocks in the detail page
  - an unused `getTaskDueBadge()` helper
  - a legacy `projects.tasks` JSON field
- The middleware/auth model and “public project browsing” query logic are not fully aligned.
- `team` and `reports` are placeholders, not real features yet.
- Timeline and assets modules are placeholder content today.
- The repo has two migration roots:
  - `web/supabase`
  - root `supabase`
  A contributor should verify which one is authoritative in deployment.

### Likely next development areas

- Split `ProjectDetailClient.tsx` into smaller module/task/workspace components
- Finish the transition away from legacy workspace/task remnants
- Clarify public vs authenticated access rules
- Expand custom module types from placeholders into real editable content
- Add stronger DB guarantees around module ordering and reorder operations
- Add tests, especially around project creation, module ordering, and task actions

## Areas That Are Unclear

These are worth calling out rather than guessing:

- The original migration that creates `public.projects` is not present in the files I scanned, so the base table definition is only partially inferable from the UI types and later migrations.
- The deployment/migration process is not encoded clearly in the repo. The presence of both `web/supabase` and root `supabase` suggests migration workflow drift.
- `EditProjectModal.tsx` and `DeleteProjectModal.tsx` exist, but the current detail page appears to render inline modal markup directly through `ModalShell` instead of using those components.

That means contributors should inspect usage before assuming a shared component is active.
