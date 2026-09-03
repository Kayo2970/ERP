# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

The actual application lives in `leads-dashboard/`. All commands below are run from inside that directory unless stated otherwise. The `PROJECT DOCS/`, `REFERENCE DATA/`, and `docs/` folders at the root are reference material only.

## Commands (run from `leads-dashboard/`)

```bash
npm run dev        # Start dev server on port 3030
npm run build      # Production build (must pass before any push to main)
npx tsc --noEmit   # Type-check only (run before build as a fast pre-check)
npm run lint       # ESLint (Next.js + TypeScript rules)
npm run setup      # One-time superuser creation script (first deploy only)
```

There is no test suite. Type-check + build passing is the acceptance bar.

## Deployment workflow (standing instruction)

`main` is the live deploy branch — the VPS runs `git pull` → `npm install` → `npm run build` → `pm2 restart leads-dashboard` off it directly.

- **Single fix/feature**: verify `npx tsc --noEmit` and `npm run build` are clean, then commit and push straight to `main`.
- **Batch of multiple distinct items**: work on one feature branch, commit as each item is done, merge to `main` only after every item in the batch is complete and verified.
- If `main` has moved since the session started, merge `main` in and re-apply changes on top — never force-push over it.

## Architecture

### Data layer (`src/lib/server-db.ts`)

The database is **flat JSON files** under `data/` (gitignored, never committed). Each collection (`members`, `events`, `tasks`, `ratings`, `reimbursements`, `announcements`, `forms`, `formTemplates`, `submissions`, `designs`, `guests`, `budgets`, `incomeSources`, `eventReports`, `auditLogs`, `emails`, `emailSettings`, `passwordResets`, `emailChanges`, `accountActivations`, `groupPolicies`, `accessLevelSettings`, `systemSettings`, `birthdayEmailLog`) lives in its own `data/<collection>.json` file, encrypted at rest via `src/lib/encryption.ts`.

Key functions:
- `readCollection(key)` — read one collection (handles decryption, first-boot seeding, one-off data migrations)
- `mutateCollection(key, mutator)` — read-modify-write with a per-collection async mutex (concurrent writes to the same collection queue; different collections never block each other)
- `readDb()` — reads all collections at once (used only by the `/api/data` aggregate poll endpoint)

On first boot for a collection, `server-db.ts` seeds it from `src/lib/local-data.ts`'s `initialX` exports. Several idempotent one-off data migrations also run at boot (email corrections, roster pruning, inline-base64 → disk-file migration for designs/reimbursements).

Uploaded files (avatars, receipt scans, design assets, visiting card photos) are stored under `data/uploads/` via `src/lib/file-storage.ts` and served through `/api/files`.

### API layer (`src/app/api/`)

REST routes, one folder per collection. Typical pattern:
- `route.ts` → GET (list) + POST (create)
- `[id]/route.ts` → PATCH (update) + DELETE

Auth routes live under `src/app/api/auth/` (login, forgot-password, change-password, override-password, email change, account activation).

### Auth & permissions (`src/lib/permissions.ts`)

No session middleware — auth state is stored in `localStorage` (the `user` key) and re-validated on every relevant API call by reading the members collection server-side. Every permission function takes the user explicitly.

Member access is controlled by:
- `tier` (1 = Super User … 7 = Alumni) — lower number = more access
- `division` (`Advisory Board` | `Core Committee` | `Training Associate` | `Alumni` | `Faculty`)
- `role` string — a role containing the word "Head" grants department-head privileges
- Group Policies (`src/lib/local-data.ts` `GroupPolicy`) — grant fine-grained module access overrides
- Access Level Settings — per-module access thresholds configurable by Super User

### Frontend (`src/app/dashboard/`)

Single-page-app feel via Next.js App Router. The shell (`src/components/dashboard-shell.tsx`) wraps all dashboard pages. Data is fetched client-side from the API routes and cached in `localStorage` with a polling interval (via `/api/data`) for live cross-session sync. Pages under `src/app/dashboard/` correspond 1:1 to sidebar navigation items: `home`, `events`, `tasks`, `ratings`, `reimbursements`, `budget`, `designs`, `forms`, `announcements`, `email`, `directory`, `guest-directory`, `guest-invites`, `policies`, `reports`, `event-reports`, `calendar`, `festivals`, `settings`, `backup`.

### Email (`src/lib/email-service.ts`)

Outbound email via `nodemailer`. Configured through Admin → Settings → Email Settings stored in the `emailSettings` collection. Supports Gmail SMTP, Outlook, custom SMTP, local Postfix relay, or a built-in direct-send engine (`src/lib/direct-smtp-transport.ts`). All sent/failed emails are logged to the `emails` collection. Scheduled emails (birthday, task reminders) are handled by `src/lib/birthday-scheduler.ts` and `src/lib/task-email-queue.ts`, wired through `src/instrumentation.ts` (Next.js server lifecycle hook).

### Key library files

| File | Purpose |
|------|---------|
| `src/lib/local-data.ts` | All TypeScript types + initial seed data |
| `src/lib/permissions.ts` | All role/access checks |
| `src/lib/server-db.ts` | File-based DB (read/mutate/migrate) |
| `src/lib/email-service.ts` | Email send + log |
| `src/lib/file-storage.ts` | Upload save/read/delete under `data/uploads/` |
| `src/lib/encryption.ts` | AES-GCM encrypt/decrypt for collection files |
| `src/lib/report-generator.ts` | PDF/DOCX report generation |
| `src/lib/period-filter.ts` | Shared date-range filter logic used across modules |
