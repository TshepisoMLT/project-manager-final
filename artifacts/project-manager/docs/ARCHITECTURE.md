# Architecture

## Application flow

```text
React views and components
  -> typed project/task state
  -> browser localStorage
```

The application is a React + Vite web app. It currently has no API or database;
browser storage is the source of persistence for this prototype.

## Main areas

- `/dashboard` — project and task summary, deadlines, and recent activity
- `/projects` — project management, templates, and project search
- `/projects/:projectId` — project details and the task board
- `/search` — search across projects, tasks, and assignees
- `/` — redirects to the dashboard

## Data model

- **Project:** name, description, archive state, and creation date.
- **Task:** project, title, description, status, priority, assignee, due date,
  checklist, comments, activity, and timestamps.
- **Project template:** a reusable project description and task definitions
  with due-date offsets from the project start.
- **Reminder:** a local in-app item linked to a task and project, with read or
  dismissed state.

## Feature behavior

- Task edits, checklist changes, comments, status moves, and project changes
  update browser storage so they remain after a reload in the same browser.
- Kanban status moves support HTML drag-and-drop and a status selector, so
  moving a task does not depend on dragging.
- Reminders are derived or recorded locally from due dates and assignment
  activity. They are not sent to another user and are not email or push
  notifications.
- Built-in templates create a project and its starter tasks. Users can also
  save an existing project as a reusable template.
- The seeded sample data makes the dashboard, board, reminder states, task
  details, and templates usable on first open.

## Data and privacy boundary

`localStorage` is scoped to the browser origin and browser profile. Clearing
browser site data removes the local copy. Multiple people do not share a
workspace, and changes in another browser are not visible here. Add
authentication, server-side ownership checks, and a shared database before
using this as a multi-user service.
