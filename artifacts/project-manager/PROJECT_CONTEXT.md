# Project context

## Product

Project Manager helps freelancers and small teams organize projects, assign
work, follow deadlines, and understand progress without the complexity of an
enterprise project tool.

## Current status

This is a browser-local prototype. The app includes a dashboard, project list,
search, task board, task details, reusable templates, and an in-app reminder
center. Data is saved in `localStorage`; it is not shared with another user or
device.

## Product scope

### Projects

- Create and edit projects.
- Archive and restore projects.
- Start from a built-in template or save a project as a reusable template.

### Tasks

- Create, edit, and delete tasks.
- Track status, priority, assignee, and due date.
- Add task descriptions, checklist items, and comments.
- Review a chronological activity history.

### Board and reminders

- Move tasks among To Do, In Progress, Review, and Done using drag-and-drop or
  the status selector.
- Filter by priority and assignee; sort by due date or priority.
- Highlight overdue tasks.
- See local in-app reminders for due-soon and overdue tasks, and assignment
  activity.

### Dashboard and search

- View active projects, completed tasks, overdue work, project progress, and
  upcoming deadlines.
- Search projects, tasks, and assignees.

## Explicit limitations

- Authentication, protected routes, team membership, and roles are not
  implemented.
- There is no database, server-side persistence, or cross-device sync.
- Reminders are not delivered by email, push notification, or to a specific
  signed-in recipient.
- Attachments, realtime collaboration, and drag-and-drop ordering within a
  column are not included.

## Next product milestone

After authentication and a shared database are added, scope user-targeted
assignment notifications and reminders, team member management, and
cross-device collaboration. Keep the current browser-local behavior clearly
identified until then.
