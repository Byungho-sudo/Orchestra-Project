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

The real app is in `web/`.

If you are changing the product, start there.

## Main Folder Map

- `web/app/`
  - routes and page files
- `web/components/`
  - shared UI
- `web/features/`
  - feature-specific code
- `web/lib/`
  - shared non-UI logic
- `web/supabase/migrations/`
  - database migrations
- `docs/`
  - repo docs

## Where UI Lives

- `web/components/ui/`
  - shared UI pieces like buttons, cards, inputs, and modals
- `web/components/layout/`
  - shared layout pieces like app layout, top nav, and sidebar wrappers
- `web/features/projects/`
  - UI for the projects page
- `web/features/project-detail/components/`
  - UI blocks for the single-project page
- `web/app/`
  - some route-local UI still lives here

## Where Logic Lives

- `web/features/projects/`
  - projects feature logic
- `web/app/(app)/projects/[id]/project-detail/`
  - route-local logic for the single-project page
- `web/lib/`
  - shared logic like Supabase setup, auth helpers, validation, and utilities

## Where Routes Live

Routes live in `web/app/`.

Main route areas:

- `web/app/(auth)/`
  - login, signup, forgot password, reset password, auth callback
- `web/app/(app)/`
  - dashboard, projects, tickets, team, reports, account settings
- `web/app/guest/`
  - guest pages
- `web/app/api/`
  - API routes

## Where Migrations Live

Use `web/supabase/migrations/` for new migrations.

There is also a root `supabase/migrations/` folder.

That root folder is legacy. Do not add new migrations there.

## If You Want To Change X, Go Here

- change a page:
  - `web/app/`
- change a shared button, card, input, or modal:
  - `web/components/ui/`
- change shared layout or navigation:
  - `web/components/layout/`
- change the projects page:
  - `web/features/projects/`
- change the single-project page:
  - `web/app/(app)/projects/[id]/`
- change shared auth, Supabase, validation, or helpers:
  - `web/lib/`
- add a migration:
  - `web/supabase/migrations/`

## Local Development

```bash
cd web
npm install
npm run dev
```

## Build Check

```bash
cd web
npm run build
```
