# Orchestra Project

## Overview

**Orchestra Project** is a centralized dashboard web application for managing projects, tracking progress, and monitoring deadlines.

The goal of the system is to provide a structured, extensible, and maintainable platform for organizing multiple initiatives in a single interface. The project is being developed incrementally using real production-style workflows, version control, and a live backend.

This is an early-stage product under active development.

---

## Current Status

**Stage:** Early Product Development
**Architecture:** Database-backed web application
**Persistence:** Supabase (PostgreSQL)

The application is fully functional locally and includes persistent data storage. Projects can be created, displayed, and deleted, with changes surviving page refreshes and application restarts.

---

## Implemented Features

### Core Functionality

* Dashboard layout with header and sidebar navigation
* Project cards displayed in a responsive grid
* Progress tracking per project
* Deadline tracking visualization
* Modal form for creating new projects
* Delete project functionality
* Persistent data storage using Supabase
* Automatic data loading on application startup

### Data Persistence

* Projects stored in a Supabase PostgreSQL database
* Data persists after page refresh
* Data persists after restarting the development server
* Real-time synchronization between UI and database

---

## Technology Stack

### Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

### Backend

* Supabase
* PostgreSQL database

### Tooling

* Node.js
* Git
* GitHub
* Cursor (primary development environment)
* Stitch AI (UI design)

---

## Project Structure

```
Orchestra-Project/
  dashboard/
    app/
    lib/
    public/
    .env.local
    package.json
    next.config.ts
    tailwind.config.ts
  README.md
```

The application lives inside the **dashboard** directory.

---

## Getting Started

### 1. Clone the repository

```
git clone https://github.com/Byungho-sudo/Orchestra-Project.git
cd Orchestra-Project/dashboard
```

### 2. Install dependencies

```
npm install
```

### 3. Configure environment variables

Create a file named:

```
.env.local
```

Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

These values can be found in your Supabase project settings.

### 4. Start the development server

```
npm run dev
```

Open your browser and navigate to:

```
http://localhost:3000
```

---

## Current Capabilities

The system currently supports:

* Creating projects
* Viewing projects
* Deleting projects
* Persistent storage
* Local development workflow

This represents a stable foundation for future feature development.

---

## Planned Features

The next development milestones are:

1. Edit project functionality (Update)
2. Project detail page (`/projects/[id]`)
3. Confirmation dialog for deletion
4. Improved deadline calculations
5. User authentication
6. File and document storage
7. Deployment to Vercel

---

## Development Principles

This project follows a disciplined incremental development approach:

* Build step-by-step
* Maintain working software at all times
* Avoid premature complexity
* Use version control consistently
* Prioritize stability over speed

---

## Author

Byungho

---

## License

This project is currently under development and does not yet include a formal license.
