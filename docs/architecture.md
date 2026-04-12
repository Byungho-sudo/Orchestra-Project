# Architecture

This document is the short source-of-truth map for the current repository layout.

## Real App Location

The real Next.js application lives in `dashboard/`.

That folder contains the App Router code, shared components, feature folders, shared libraries, and the active Supabase migration history used by the app.

## Routes

Routes live in `dashboard/app/`.

Current high-level structure:

- `dashboard/app/(auth)/`
  - auth-related routes grouped without changing public URLs
- `dashboard/app/(app)/`
  - main signed-in product routes grouped without changing public URLs
- `dashboard/app/guest/`
  - guest flow routes
- `dashboard/app/api/`
  - server route handlers

Route groups are organizational only. They do not change the public URL paths.

## Shared Components

Shared components live in:

- `dashboard/components/ui/`
  - reusable UI primitives and shared surface components
- `dashboard/components/layout/`
  - app layout, top navigation, sidebar shell, and other shared layout pieces

## Feature Code

Feature-owned code lives under `dashboard/features/`.

Current examples:

- `dashboard/features/projects/`
  - projects list surface, project CRUD modals, and related hooks
- `dashboard/features/project-detail/components/`
  - extracted project-detail rendering components such as modal blocks

Some feature code still remains route-local under `dashboard/app/(app)/projects/[id]/project-detail/`. That is current implemented state where ownership is still closely tied to the route.

## Shared Infrastructure and Lib Code

Shared non-UI infrastructure lives in `dashboard/lib/`.

Examples:

- Supabase clients and config
- auth helpers
- validation helpers
- project and UI helper modules

This folder is the right home for code that is shared across routes or features and is not itself route rendering.

## Migration Source of Truth

Authoritative migration location going forward:

- `dashboard/supabase/migrations/`

Current status:

- `dashboard/supabase/migrations/` contains the active application migration history
- `supabase/migrations/` exists at the repo root but is legacy and should not receive new migrations

Policy:

1. Add all new migrations to `dashboard/supabase/migrations/`
2. Do not add new migrations to `supabase/migrations/`
3. Do not move or rewrite historical migration files during documentation-only cleanup phases unless the move is separately planned and verified

## Current Direction vs Future Direction

Current implemented state:

- route groups are in place for auth and main app routes
- shared UI and layout components have started moving out of `app/`
- some feature code has been moved into `dashboard/features/`
- some route-local code still remains inside `dashboard/app/`

Future direction:

- keep `dashboard/app/` focused on routing, route-local orchestration, and page entry points
- keep shared components in `dashboard/components/`
- keep feature-owned code in `dashboard/features/`
- keep shared infrastructure in `dashboard/lib/`

That direction is guidance, not a claim that every folder has already been fully normalized.
