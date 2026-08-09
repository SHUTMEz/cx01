# AI Agent Instructions

## Before Coding

- Read CONTEXT.md
- Read DESIGN.md
- Search for existing implementation.
- Understand the current architecture.

---

## General Rules

- Never rename files unless requested.
- Never delete existing code without reason.
- Never install new packages unless requested.
- Never modify .env files.
- Never change database schema unless requested.

---

## Code Rules

- Use TypeScript Strict.
- Never use any.
- Use existing utilities.
- Reuse existing components.
- Follow existing coding style.

---

## UI Rules

- Follow DESIGN.md.
- Support Light and Dark mode.
- Use Tailwind CSS only.
- Use Motion for animations.
- Use Sonner for notifications.

---

## API Rules

- Validate every request.
- Keep route.ts minimal.
- Business logic belongs in service.ts.
- Never access database inside route.ts.

---

## Database Rules

- Use Drizzle ORM.
- No raw SQL unless required.
- Use transactions when needed.

---

## Before Creating New Files

Check if one already exists.

Search

- Components
- Hooks
- Services
- Utilities
- Database helpers

Avoid duplicates.

---

## Response Style

When making changes

- Explain what changed.
- Explain why.
- Mention affected files.

## Workflow

When implementing a feature

1. Read related files.
2. Search for existing implementation.
3. Create implementation.
4. Keep style consistent.
5. Check TypeScript errors.
6. Check lint errors.
7. Summarize changes.
---

## Don't

- Don't rewrite working code.
- Don't over-engineer.
- Don't create abstractions too early.
- Don't introduce unnecessary dependencies.
- Don't ignore existing architecture.
---