# Project Manager

A project and task manager for freelancers and small teams. Plan projects, move
work through a Kanban board, keep task context in one place, and stay aware of
upcoming deadlines.

## Features

- Dashboard with project progress, overdue work, upcoming deadlines, and recent
  activity
- Project creation, editing, archiving, and restoring
- Reusable project templates, including starter tasks
- Task creation, editing, deletion, filtering, and sorting
- Kanban drag-and-drop with an accessible status selector as an alternative
- Task details with a description, checklist, comments, and activity history
- In-app reminders for tasks due soon or overdue
- Search across projects, tasks, and assignees

## Run locally

From the workspace root:

```bash
pnpm --filter @workspace/project-manager run dev
```

Useful checks:

```bash
pnpm --filter @workspace/project-manager run typecheck
pnpm --filter @workspace/project-manager run build
```

## Data and limitations

This version stores sample and user-created data in the current browser's
`localStorage`. It does not use a database or real authentication, and data does
not sync between people, browsers, or devices. Reminders are in-app only; there
are no email or push notifications. Do not use it to store sensitive or
business-critical information.

See [Project context](./PROJECT_CONTEXT.md), [Architecture](./docs/ARCHITECTURE.md),
and [Deployment](./docs/DEPLOYMENT.md) for more detail.
