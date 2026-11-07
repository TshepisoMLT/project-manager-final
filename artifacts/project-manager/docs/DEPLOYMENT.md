# Deployment

The app is a Vite web artifact and runs through its managed Project Manager
workflow in Replit.

## Local development

From the workspace root:

```bash
pnpm --filter @workspace/project-manager run dev
```

## Build checks

```bash
pnpm --filter @workspace/project-manager run typecheck
pnpm --filter @workspace/project-manager run build
```

Use Replit's Publish action to publish the app. No external service or
environment variable is required for the browser-local prototype.

## Before using with a team

The current app does not authenticate users or connect to a shared database.
Published data remains in each visitor's own browser storage. Add authentication,
server-side access controls, and shared persistence before relying on it for
team data. In-app reminders do not send email or push notifications.
