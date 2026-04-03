# Orchestra Project

## Overview

**Orchestra Project** is a full-stack web application for managing projects, tracking progress, and organizing work in a centralized dashboard.

The system is designed to be:

* Practical
* Maintainable
* Production-oriented
* Incrementally expandable

It is currently deployed and used as a real shared tool across multiple devices.

---

## Live Application

**Production URL**

```
https://orchestra.vercel.app
```

The application is hosted on **Vercel** and connected to a live **Supabase** database.

---

## Current Capabilities

### Core Features

* Create projects
* View projects
* Edit projects
* Delete projects
* Persistent database storage
* Real-time shared data across devices
* Production deployment
* Automatic redeployment on push

### UI Behavior States

The system correctly handles:

* Loading state
* Empty state
* Error state
* Delete confirmation
* Immediate UI updates after database actions

---

## Technology Stack

### Frontend

* Next.js (App Router)
* React
* TypeScript / JavaScript
* Tailwind CSS

### Backend

* Supabase

### Database

* PostgreSQL (via Supabase)

### Hosting

* Vercel

### Version Control

* Git
* GitHub

---

## Project Structure

```
Orchestra-Project/

dashboard/

app/
  page.tsx

lib/
  supabase.ts

public/

.env.local

package.json
next.config.ts
tailwind.config.ts
.gitignore
README.md
```

Important:

The application lives inside:

```
dashboard/
```

---

## Development Workflow

1. Design UI
2. Implement feature
3. Run locally

```
npm run dev
```

4. Test behavior
5. Commit changes
6. Push to GitHub
7. Automatic deployment via Vercel

---

## Local Setup

### 1. Clone the repository

```
git clone https://github.com/Byungho-sudo/Orchestra-Project.git
cd Orchestra-Project/dashboard
```

### 2. Install dependencies

```
npm install
```

### 3. Create environment variables

Create a file:

```
.env.local
```

Add:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### 4. Start the development server

```
npm run dev
```

The app will run at:

```
http://localhost:3000
```

---

## Environment Variables

Required:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

These values are provided by your Supabase project.

Never commit real keys to the repository.

---

## Deployment

The application is deployed using:

**Vercel**

Deployment behavior:

* Push to `main`
* Vercel builds automatically
* Site updates automatically

No manual deployment required.

---

## Current System Status

The application currently provides:

* Live production deployment
* Shared database access
* Multi-device synchronization
* Stable CRUD operations
* Reliable UI state handling

This represents:

**Dashboard v1 — Stable Foundation**

---

## Known Limitations

The system does not yet include:

* User authentication
* Project detail pages
* File attachments
* Role permissions
* Advanced filtering
* Analytics
* Notifications

These are planned future features.

---

## Next Development Steps

Priority roadmap:

1. Project detail page

```
app/projects/[id]/page.tsx
```

2. Authentication system
3. Project navigation
4. Data visualization (charts)
5. Deployment refinement
6. Permissions and roles

---

## Purpose

This project exists to:

* Build a real production system
* Support collaborative project management
* Learn modern full-stack architecture
* Establish a scalable development foundation

---

## License

Private internal project.

---

## Author

Byung Ho
