# Orchestra Project

## What This Project Is

Orchestra is a Next.js app.

It is used for:

- projects
- project detail workspaces
- tickets
- team pages
- guest access
- login and account settings

## Where The Real App Is

The real app is in `dashboard/`.

If you are changing the product, start there.

## Main Folder Map

- `dashboard/app/`
  - routes and page files
- `dashboard/components/`
  - shared UI
- `dashboard/features/`
  - feature-specific code
- `dashboard/lib/`
  - shared non-UI logic
- `dashboard/supabase/migrations/`
  - database migrations
- `docs/`
  - repo docs

## Where UI Lives

- `dashboard/components/ui/`
  - shared UI pieces like buttons, cards, inputs, and modals
- `dashboard/components/layout/`
  - shared layout pieces like app layout, top nav, and sidebar wrappers
- `dashboard/features/projects/`
  - UI for the projects page
- `dashboard/features/project-detail/components/`
  - UI blocks for the single-project page
- `dashboard/app/`
  - some route-local UI still lives here

## Where Logic Lives

- `dashboard/features/projects/`
  - projects feature logic
- `dashboard/app/(app)/projects/[id]/project-detail/`
  - route-local logic for the single-project page
- `dashboard/lib/`
  - shared logic like Supabase setup, auth helpers, validation, and utilities

## Where Routes Live

Routes live in `dashboard/app/`.

Main route areas:

- `dashboard/app/(auth)/`
  - login, signup, forgot password, reset password, auth callback
- `dashboard/app/(app)/`
  - dashboard, projects, tickets, team, reports, account settings
- `dashboard/app/guest/`
  - guest pages
- `dashboard/app/api/`
  - API routes

## Where Migrations Live

Use `dashboard/supabase/migrations/` for new migrations.

There is also a root `supabase/migrations/` folder.

That root folder is legacy. Do not add new migrations there.

## If You Want To Change X, Go Here

- change a page:
  - `dashboard/app/`
- change a shared button, card, input, or modal:
  - `dashboard/components/ui/`
- change shared layout or navigation:
  - `dashboard/components/layout/`
- change the projects page:
  - `dashboard/features/projects/`
- change the single-project page:
  - `dashboard/app/(app)/projects/[id]/`
- change shared auth, Supabase, validation, or helpers:
  - `dashboard/lib/`
- add a migration:
  - `dashboard/supabase/migrations/`

## Local Development

```bash
cd dashboard
npm install
npm run dev
```

## Build Check

```bash
cd dashboard
npm run build
```
