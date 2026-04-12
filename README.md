# Orchestra Project

Orchestra is a Next.js App Router application for project workspaces, tickets, team views, guest access, and account/auth flows.

The real application lives in [`dashboard/`](dashboard/). The repository root is a workspace wrapper plus shared documentation and database history.

## Current State

Implemented today:

- Next.js App Router app under `dashboard/`
- Supabase-backed auth and data access
- signed-in product routes for dashboard, projects, tickets, team, reports, and account settings
- project detail workspace with module-based sections
- guest entry flow and invite-code support

This README describes the current implemented structure. It does not assume future refactors or planned features.

## Where Things Live

- App source: `dashboard/`
- Routes: `dashboard/app/`
- Shared components: `dashboard/components/`
- Feature-owned UI/code: `dashboard/features/`
- Shared infrastructure and helpers: `dashboard/lib/`
- Active migrations: `dashboard/supabase/migrations/`
- Additional repo docs: `docs/`

See [`docs/architecture.md`](docs/architecture.md) for the short architecture map and migration policy.

## Route Layout

The app uses Next.js route groups to keep URLs stable while improving folder organization.

- Auth routes: `dashboard/app/(auth)/`
  - public URLs stay `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`
- Signed-in product routes: `dashboard/app/(app)/`
  - public URLs stay `/dashboard`, `/projects`, `/tickets`, `/team`, `/reports`, `/settings/account`
- Other root app areas remain outside those groups where appropriate, including `guest` and `api`

## Shared vs Feature Code

- `dashboard/components/ui/`
  - reusable UI primitives
- `dashboard/components/layout/`
  - shared layout and navigation shells
- `dashboard/features/projects/`
  - projects list and projects CRUD surface
- `dashboard/features/project-detail/components/`
  - extracted project-detail rendering blocks such as modals

Some route-local code still lives under `dashboard/app/...` where it is tightly coupled to a single route. That is current state, not a contradiction.

## Database Migration Source of Truth

Use `dashboard/supabase/migrations/` for all new migrations going forward.

There is also a root-level legacy folder at `supabase/migrations/`. Do not add new migrations there. It remains in the repo as historical residue until it can be consolidated safely in a later phase.

## Local Development

From the repo root:

```bash
cd dashboard
npm install
npm run dev
```

Local app URL:

```text
http://localhost:3000
```

Required environment variables in `dashboard/.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Build Verification

From `dashboard/`:

```bash
npm run build
```

## Deployment

- Frontend/app hosting: Vercel
- Auth and database: Supabase

## Documentation

- Architecture and folder ownership: [`docs/architecture.md`](docs/architecture.md)
- Existing database notes: [`docs/database-notes.md`](docs/database-notes.md)

## License

Private internal project.
