# Architecture

This file explains where code lives in this repo today.

## Real App Location

The real Next.js app is in `web/`.

## Main Folders

- `web/app/`
  - routes and page entry points
- `web/components/`
  - shared UI
- `web/features/`
  - code for one feature area
- `web/lib/`
  - shared non-UI logic
- `web/supabase/migrations/`
  - active database migrations

## Where UI Lives

Shared UI lives in:

- `web/components/ui/`
- `web/components/layout/`

Feature UI lives in:

- `web/features/projects/`
- `web/features/project-detail/components/`

Some route-local UI still lives in `web/app/` where it is tightly tied to one route.

## Where Logic Lives

Shared logic lives in:

- `web/lib/`

Feature logic lives in:

- `web/features/projects/`

Route-local logic still lives in:

- `web/app/(app)/projects/[id]/project-detail/`

## Route Structure

Routes live in `web/app/`.

Main route groups:

- `web/app/(auth)/`
  - auth pages
- `web/app/(app)/`
  - main signed-in app pages

Other route areas:

- `web/app/guest/`
- `web/app/api/`

The route groups are only for folder organization.

They do not change the public URL.

## Shared Code

Shared code means code used in more than one place.

That usually goes in:

- `web/components/` for shared UI
- `web/lib/` for shared non-UI code

Examples:

- shared button -> `web/components/ui/`
- shared app layout -> `web/components/layout/`
- shared Supabase helper -> `web/lib/`

## Feature-Specific Code

Feature-specific code belongs to one product area.

That goes in `web/features/`.

Current example:

- `web/features/projects/`
  - projects list UI
  - project CRUD modals
  - projects hooks and related logic

## Route-Local Code

Some code is still best kept close to a route.

Current example:

- `web/app/(app)/projects/[id]/project-detail/`

This folder still holds route-local project detail code that is closely tied to that page.

## Migration Source Of Truth

New migrations go in:

- `web/supabase/migrations/`

Do not add new migrations to:

- `supabase/migrations/`

That root folder is legacy.

## Simple Rules

- `app/` = routes and page files
- `components/` = shared UI
- `features/` = one feature area
- `lib/` = shared non-UI logic

## If You Want To Change X

- change a route:
  - `web/app/`
- change shared UI:
  - `web/components/`
- change shared logic:
  - `web/lib/`
- change the projects area:
  - `web/features/projects/`
- change single-project route-local code:
  - `web/app/(app)/projects/[id]/project-detail/`
- add a migration:
  - `web/supabase/migrations/`
