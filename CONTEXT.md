# Project Context

## Overview
//** ---- **//

Stack
- Next.js 16
- React 19
- Tailwind CSS v4
- SQLite via Tauri SQL + Drizzle ORM
- Drizzle ORM

## Folder Structure
app/
 - (layoutname)/ /* ex (app) , (dashboard) , (admin) */
   - layout.tsx
   - page.tsx
 - api/v1/
   - routename/
     - route.tsx
     - service.tsx
     - controller.tsx
components/
 - ComponentName/
   - index.tsx
   - subcomponent.tsx
system/
 - middleware/
 - database/
   - shcema/
 - system name/
   - service.ts
   - controller.ts
 - middleware/

## Routing
- Public pages inside app/(app)
- Dashboard inside app/(dashboard)
  - User Dashboard
    - require auth and role check
  - Reseller Dashboard
    - require auth and role check
  - Admin Dashboard
    - require auth and role check
- API Version: /api/v1/*

## API Rules

Route

route.ts
controller.ts
service.ts

Flow

Request
→ Validation
→ Controller
→ Service
→ Database

Never access database directly from route.ts

## Database

- SQLite via Tauri SQL + Drizzle ORM
- Drizzle ORM

Rules

- Never write raw SQL unless required
- Always use relations
- Schema located at app/db/schema.ts

## Component Rules

- One component per folder
- Export from index.tsx
- Sub components stay inside the same folder
- Shared components inside components/

## Coding Style
- Use TypeScript Strict
- Functional Components Only
- Don't use any
- Server Actions Before API Routes If possible
- Import Alias use @/

## Design

Read DESIGN.md before creating UI.

Requirements

- Responsive
- Mobile First
- Tailwind CSS only
- No inline styles
- Reuse existing UI components

## Authentication

- Better Auth
- Session Cookie
- Middleware Login

## Naming

Components
 - UserCard.tsx

Hooks
 - useAuth.ts

Services
 - user.service.ts

Controllers
 - user.controller.ts

## AI Rules

- Don't rename existing files
- Don't move folders
- Don't edit environment files
- Don't install new packages unless requested
- Don't add comment in code
- Reuse existing components
- Reuse utilities before creating new ones
- Keep code style consistent

## Important

Before creating

- Search existing components
- Search existing hooks
- Search existing utilities
- Search existing services

Avoid duplicate implementations.
