# Orchestra Project — Agent Guidance

## Architecture Categories

Current responsibility layers:

- hook logic
- component rendering
- helper logic
- orchestration

Definitions:

Hook logic:
Behavior, async workflows, mutations, validation, and persistence coordination.

Component rendering:
UI sections, layout composition, and render-heavy branches.

Helper logic:
Pure functions such as shaping, normalization, sorting, and shared utilities.

Orchestration:
Coordination of hooks and components, shallow page-level UI state, and wiring.

## ProjectDetailClient.tsx

This file is the page orchestrator.

It should coordinate behavior rather than accumulate new logic.

It may temporarily hold small uncategorized logic if no better category exists yet,
but that logic should remain isolated and easy to extract later.

## Growth Awareness

If ProjectDetailClient.tsx grows significantly during a task:

- briefly explain what responsibility was added
- state whether the growth is temporary or appropriate
- note any obvious future extraction opportunity

This rule is for awareness, not restriction.

## Flexibility

Treat the architecture as guided but adaptable.

If a new responsibility pattern begins repeating,
propose a new category or boundary rather than forcing existing ones.

## Folder Placement Rules

Use the existing repo structure on purpose. Before creating a file, decide whether it is:

- route-local
- shared UI
- feature-owned
- shared non-UI logic

Then place it accordingly.

### 1. Route Files

Route files go in `web/app/`.

This includes:

- page entry points
- route handlers
- route-local orchestration
- route-local code that is tightly coupled to one page or route

Do not move shared code into `web/app/` just because a route uses it.

### 2. Shared UI

Shared UI goes in `web/components/`.

Use:

- `web/components/ui/` for reusable UI primitives
- `web/components/layout/` for shared layout and navigation

Do not place new shared UI inside `web/app/`.

### 3. Feature-Specific Code

Feature-owned code goes in `web/features/`.

If code clearly belongs to one product area, prefer the matching feature folder.

Examples:

- projects list / project CRUD -> `web/features/projects/`
- extracted project-detail rendering blocks -> `web/features/project-detail/`

Do not place new feature-owned code in generic catch-all folders when a feature folder already exists.

### 4. Shared Non-UI Logic

Shared non-UI logic goes in `web/lib/`.

This includes:

- helpers
- validation
- config
- shared infrastructure
- shared auth utilities
- shared Supabase utilities

### 5. Database Migrations

New database migrations go only in:

- `web/supabase/migrations/`

Do not add new migrations to:

- `supabase/migrations/`

That root-level folder is legacy.

### 6. Prefer Existing Structure

Prefer the existing structure over inventing new structure.

- reuse existing feature folders
- reuse existing shared component folders
- avoid creating new ad hoc buckets unless a repeated responsibility clearly exists

### 7. Large Orchestrator Files

If adding code to a large orchestrator file:

- keep the logic isolated
- prefer extracting rendering blocks, helpers, or hooks when the boundary is already clear
- mention whether the growth is temporary
- note obvious extraction opportunities

This applies especially to `ProjectDetailClient.tsx`, which should remain an orchestrator rather than becoming a catch-all file.
