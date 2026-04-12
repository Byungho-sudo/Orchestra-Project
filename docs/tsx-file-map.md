# TSX File Map

This file is a practical map of every `.tsx` file in the repo.

How to read it:

- **Responsibility** = what the file does
- **Category** = what kind of file it is
- **Filename** = whether the current name is clear enough

File categories used here:

- **route file** = Next.js route entry file like `page.tsx`, `layout.tsx`, or `loading.tsx`
- **shared UI** = reusable UI used in multiple places
- **shared layout** = shared app shell, navigation, or layout wrapper
- **feature UI** = UI owned by one feature area
- **route-local UI** = UI that belongs to one route and is intentionally not shared
- **orchestrator** = file that wires state, handlers, and child components together
- **modal** = modal dialog component
- **form** = form component
- **page-specific helper component** = small component that supports one page or module

## Files

### `web/app/layout.tsx`
- Responsibility: Root app layout and global wrappers.
- Category: route file
- Filename: good as-is

### `web/app/page.tsx`
- Responsibility: Root landing route entry.
- Category: route file
- Filename: good as-is

### `web/app/(app)/dashboard/page.tsx`
- Responsibility: Dashboard overview page composition.
- Category: route file
- Filename: good as-is

### `web/app/(app)/projects/loading.tsx`
- Responsibility: Loading state for the projects route.
- Category: route file
- Filename: good as-is

### `web/app/(app)/projects/page.tsx`
- Responsibility: Server route entry for the projects page.
- Category: route file
- Filename: good as-is

### `web/app/(app)/projects/ProjectsPageContent.tsx`
- Responsibility: Client-side projects page orchestrator that opens the create-project flow and renders the projects grid.
- Category: orchestrator
- Filename: good as-is

### `web/app/(app)/projects/[id]/loading.tsx`
- Responsibility: Loading state for a single project page.
- Category: route file
- Filename: good as-is

### `web/app/(app)/projects/[id]/page.tsx`
- Responsibility: Server route entry for a single project page.
- Category: route file
- Filename: good as-is

### `web/app/(app)/projects/[id]/ProjectDetailClient.tsx`
- Responsibility: Main orchestrator for the single-project page. Wires data, navigation, drag/drop, and modal state.
- Category: orchestrator
- Filename: acceptable

### `web/app/(app)/projects/[id]/project-detail/AssetsModule.tsx`
- Responsibility: Route-local asset module UI for listing, creating, editing, moving, and deleting project assets.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ChecklistDueDate.tsx`
- Responsibility: Route-local due date picker and quick-date helper for checklist tasks.
- Category: page-specific helper component
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/MetricsModule.tsx`
- Responsibility: Route-local metrics module UI for tracking project metrics.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ModuleStackFooter.tsx`
- Responsibility: Route-local footer with add-module and reset-module actions.
- Category: page-specific helper component
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/NotesModule.tsx`
- Responsibility: Route-local notes module with autosave and template actions.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ProjectContextPanel.tsx`
- Responsibility: Right-side project context panel with project facts and edit actions.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ProjectDetailHeader.tsx`
- Responsibility: Header card for the single-project page.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ProjectHealthSummary.tsx`
- Responsibility: Route-local project summary card with health/status controls.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ProjectMobileContext.tsx`
- Responsibility: Mobile version of the project context panel.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ProjectMobileNavigation.tsx`
- Responsibility: Mobile module navigation drawer for the single-project page.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ProjectModuleContent.tsx`
- Responsibility: Chooses and renders the content for each project module type.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ProjectModuleList.tsx`
- Responsibility: Renders the ordered module stack and drag/drop behavior.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ProjectModuleSection.tsx`
- Responsibility: Wrapper for one module section, including selection and drag shell behavior.
- Category: page-specific helper component
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/ProjectSidebarNav.tsx`
- Responsibility: Desktop sidebar navigation for the single-project page.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/projects/[id]/project-detail/TimelineModule.tsx`
- Responsibility: Route-local timeline module UI for events and progress.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/reports/page.tsx`
- Responsibility: Reports route entry.
- Category: route file
- Filename: good as-is

### `web/app/(app)/settings/account/page.tsx`
- Responsibility: Account settings page entry and page composition.
- Category: route file
- Filename: good as-is

### `web/app/(app)/settings/account/components/InviteAccessSection.tsx`
- Responsibility: Account-settings section for invite access management.
- Category: route-local UI
- Filename: good as-is

### `web/app/(app)/team/page.tsx`
- Responsibility: Team page route entry and page composition.
- Category: route file
- Filename: good as-is

### `web/app/(app)/tickets/page.tsx`
- Responsibility: Tickets page route entry, orchestration, and ticket card rendering.
- Category: orchestrator
- Filename: good as-is

### `web/app/(app)/tickets/TicketForm.tsx`
- Responsibility: Shared ticket create/edit form used by the tickets page.
- Category: form
- Filename: good as-is

### `web/app/(auth)/auth/callback/page.tsx`
- Responsibility: Auth callback route entry.
- Category: route file
- Filename: good as-is

### `web/app/(auth)/forgot-password/page.tsx`
- Responsibility: Forgot-password route entry.
- Category: route file
- Filename: good as-is

### `web/app/(auth)/login/page.tsx`
- Responsibility: Login route entry.
- Category: route file
- Filename: good as-is

### `web/app/(auth)/reset-password/page.tsx`
- Responsibility: Reset-password route entry.
- Category: route file
- Filename: good as-is

### `web/app/(auth)/signup/page.tsx`
- Responsibility: Signup route entry.
- Category: route file
- Filename: good as-is

### `web/app/guest/GuestAccessClient.tsx`
- Responsibility: Client-side guest access flow for invite-code validation and guest profile setup.
- Category: orchestrator
- Filename: worth renaming
- Suggested name: `GuestAccessPageClient.tsx`
- Why: this is the main client page body, not a small helper.

### `web/app/guest/page.tsx`
- Responsibility: Guest route entry.
- Category: route file
- Filename: good as-is

### `web/components/layout/AppLayout.tsx`
- Responsibility: Shared top-level app layout with header and mobile navigation support.
- Category: shared layout
- Filename: good as-is

### `web/components/layout/AppShell.tsx`
- Responsibility: Shared signed-in page shell that adds the app sidebar next to page content.
- Category: shared layout
- Filename: good as-is

### `web/components/layout/DashboardSidebar.tsx`
- Responsibility: Shared global app navigation sidebar and reusable dashboard navigation links.
- Category: shared layout
- Filename: acceptable

### `web/components/layout/GuestSettingsMenu.tsx`
- Responsibility: Shared menu for guest account/settings actions.
- Category: shared layout
- Filename: good as-is

### `web/components/layout/Sidebar.tsx`
- Responsibility: Shared sidebar primitives and item styles.
- Category: shared layout
- Filename: good as-is

### `web/components/layout/TopNavBar.tsx`
- Responsibility: Shared top navigation bar with account and mobile menu behavior.
- Category: shared layout
- Filename: good as-is

### `web/components/ui/Badge.tsx`
- Responsibility: Shared badge primitive.
- Category: shared UI
- Filename: good as-is

### `web/components/ui/Button.tsx`
- Responsibility: Shared button primitive.
- Category: shared UI
- Filename: good as-is

### `web/components/ui/Card.tsx`
- Responsibility: Shared card surface primitive.
- Category: shared UI
- Filename: good as-is

### `web/components/ui/Input.tsx`
- Responsibility: Shared input primitive.
- Category: shared UI
- Filename: good as-is

### `web/components/ui/Modal.tsx`
- Responsibility: Shared modal wrapper with close and unsaved-change behavior.
- Category: shared UI
- Filename: good as-is

### `web/components/ui/PageShell.tsx`
- Responsibility: Shared page section wrapper used to keep page spacing consistent.
- Category: shared UI
- Filename: acceptable

### `web/components/ui/SectionHeader.tsx`
- Responsibility: Shared section header block for page sections.
- Category: shared UI
- Filename: good as-is

### `web/components/ui/Select.tsx`
- Responsibility: Shared select primitive.
- Category: shared UI
- Filename: good as-is

### `web/components/ui/Textarea.tsx`
- Responsibility: Shared textarea primitive.
- Category: shared UI
- Filename: good as-is

### `web/features/dashboard/DashboardHeader.tsx`
- Responsibility: Dashboard-specific header with account label and actions.
- Category: feature UI
- Filename: good as-is

### `web/features/dashboard/DashboardStatCard.tsx`
- Responsibility: Dashboard-specific stat card used on the overview page.
- Category: feature UI
- Filename: good as-is

### `web/features/project-detail/components/AddModuleModal.tsx`
- Responsibility: Modal for creating a new project workspace module.
- Category: modal
- Filename: good as-is

### `web/features/project-detail/components/DeleteProjectModal.tsx`
- Responsibility: Modal for deleting a project from the single-project page.
- Category: modal
- Filename: good as-is

### `web/features/project-detail/components/EditMetadataModal.tsx`
- Responsibility: Modal for editing custom project metadata fields.
- Category: modal
- Filename: good as-is

### `web/features/project-detail/components/EditModuleModal.tsx`
- Responsibility: Modal for editing a workspace module.
- Category: modal
- Filename: good as-is

### `web/features/project-detail/components/EditProjectModal.tsx`
- Responsibility: Modal for editing project details from the single-project page.
- Category: modal
- Filename: good as-is

### `web/features/projects/DeleteProjectModal.tsx`
- Responsibility: Modal for deleting a project from the projects list surface.
- Category: modal
- Filename: good as-is

### `web/features/projects/EditProjectModal.tsx`
- Responsibility: Modal for editing a project from the projects list surface.
- Category: modal
- Filename: good as-is

### `web/features/projects/ProjectModalShell.tsx`
- Responsibility: Feature-level alias for the shared modal wrapper used by project-related modals.
- Category: feature UI
- Filename: good as-is

### `web/features/projects/NewProjectModal.tsx`
- Responsibility: Modal for creating a new project.
- Category: modal
- Filename: good as-is

### `web/features/projects/ProjectCard.tsx`
- Responsibility: Card UI for one project in the projects grid.
- Category: feature UI
- Filename: good as-is

### `web/features/projects/ProjectsGrid.tsx`
- Responsibility: Main projects list surface with fetch state, toolbar, cards, and CRUD modals.
- Category: feature UI
- Filename: good as-is

### `web/features/projects/ProjectsGridSkeleton.tsx`
- Responsibility: Skeleton loading state for the projects grid.
- Category: feature UI
- Filename: good as-is

### `web/features/projects/ProjectsGridStates.tsx`
- Responsibility: Empty and error states for the projects grid.
- Category: page-specific helper component
- Filename: acceptable

### `web/features/projects/ProjectToolbar.tsx`
- Responsibility: Toolbar for search, filtering, and actions on the projects page.
- Category: feature UI
- Filename: good as-is

## Rename Suggestions

Only these files look genuinely worth renaming right now:

### `web/app/guest/GuestAccessClient.tsx`
- Suggested name: `GuestAccessPageClient.tsx`
- Reason: makes it clear that this is the main client-side page component for the guest route.
