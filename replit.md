# Project Manager

A project and task manager for freelancers and small teams, with task context,
reusable templates, and browser-local due-date reminders.

## Run & Operate

- `pnpm --filter @workspace/project-manager run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- App checks: `pnpm --filter @workspace/project-manager run typecheck` and
  `pnpm --filter @workspace/project-manager run build`
- No environment variables are required by the browser-local prototype.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- App: React + Vite + TypeScript
- Persistence: browser `localStorage`
- Build: Vite

## Where things live

- `artifacts/project-manager/src/` — app UI, state, and styles
- `artifacts/project-manager/README.md` — overview and run commands
- `artifacts/project-manager/PROJECT_CONTEXT.md` — product scope and limitations
- `artifacts/project-manager/docs/` — architecture and deployment notes

## Architecture decisions

- The current version is intentionally browser-local; it is not a multi-user app.
- Reminders are in-app only, not email, push, or private recipient notifications.
- Keep drag-and-drop paired with a status control for keyboard and touch users.
- Keep templates local until shared persistence is implemented.

## Product

- Dashboard, project create/edit/archive/restore, project templates, search,
  filtered Kanban board, task details/checklist/comments/activity, and local
  reminders.

## User preferences

- The user asked to add task details, drag-and-drop, reminders, and reusable
  project templates, and update the documentation.

## Gotchas

- Data lives in each browser's `localStorage` and does not sync across devices.
- Authentication, a database, and team-level notifications are not implemented.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
