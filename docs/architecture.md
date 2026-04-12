# Architecture

This file explains where code lives in this repo today.

## Real App Location

The real Next.js app is in `dashboard/`.

## Main Folders

- `dashboard/app/`
  - routes and page entry points
- `dashboard/components/`
  - shared UI
- `dashboard/features/`
  - code for one feature area
- `dashboard/lib/`
  - shared non-UI logic
- `dashboard/supabase/migrations/`
  - active database migrations

## Where UI Lives

Shared UI lives in:

- `dashboard/components/ui/`
- `dashboard/components/layout/`

Feature UI lives in:

- `dashboard/features/projects/`
- `dashboard/features/project-detail/components/`

Some route-local UI still lives in `dashboard/app/` where it is tightly tied to one route.

## Where Logic Lives

Shared logic lives in:

- `dashboard/lib/`

Feature logic lives in:

- `dashboard/features/projects/`

Route-local logic still lives in:

- `dashboard/app/(app)/projects/[id]/project-detail/`

## Route Structure

Routes live in `dashboard/app/`.

Main route groups:

- `dashboard/app/(auth)/`
  - auth pages
- `dashboard/app/(app)/`
  - main signed-in app pages

Other route areas:

- `dashboard/app/guest/`
- `dashboard/app/api/`

The route groups are only for folder organization.

They do not change the public URL.

## Shared Code

Shared code means code used in more than one place.

That usually goes in:

- `dashboard/components/` for shared UI
- `dashboard/lib/` for shared non-UI code

Examples:

- shared button -> `dashboard/components/ui/`
- shared app layout -> `dashboard/components/layout/`
- shared Supabase helper -> `dashboard/lib/`

## Feature-Specific Code

Feature-specific code belongs to one product area.

That goes in `dashboard/features/`.

Current example:

- `dashboard/features/projects/`
  - projects list UI
  - project CRUD modals
  - projects hooks and related logic

## Route-Local Code

Some code is still best kept close to a route.

Current example:

- `dashboard/app/(app)/projects/[id]/project-detail/`

This folder still holds route-local project detail code that is closely tied to that page.

## Migration Source Of Truth

New migrations go in:

- `dashboard/supabase/migrations/`

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
  - `dashboard/app/`
- change shared UI:
  - `dashboard/components/`
- change shared logic:
  - `dashboard/lib/`
- change the projects area:
  - `dashboard/features/projects/`
- change single-project route-local code:
  - `dashboard/app/(app)/projects/[id]/project-detail/`
- add a migration:
  - `dashboard/supabase/migrations/`
