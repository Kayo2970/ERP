# LEADS Next Gen All-in-One Dashboard

This repository contains the private internal operations and management dashboard for the **LEADS Next Gen Centre at MSRUAS, Bengaluru**. It consolidates task traceability, event management, performance evaluation, reimbursement claims, dynamic public form building, and roster management into a single, cohesive portal.

---

## 📂 Project Structure

- **`leads-dashboard/`**: The Next.js (App Router) + TypeScript + Tailwind CSS (v4) project containing the active implementation of the dashboard.
- **`PROJECT DOCS/`**: Curated product specifications, sitemaps, database models, technical specifications, and copywriting guidelines.
- **`REFERENCE DATA/`**: Official Ramaiah University of Applied Sciences leadership directory, hierarchy structure, source images, and references.
- **`docs/`**: Engineering/ops working docs — the member login roster, the bug audit log, and implementation specs for past fix passes.

---

## 🚀 Getting Started

### 1. Running the LEADS Next Gen Dashboard (Active Implementation)

The dashboard is built using **Next.js** and **Tailwind CSS v4** featuring a modern, premium space-themed glassmorphic UI.

```bash
# Navigate to the project directory
cd leads-dashboard

# Install dependencies
npm install

# Run the development server
npm run dev -- -p 3030
```

Open [http://localhost:3030](http://localhost:3030) in your browser to view the login screen.

---

## 🖥️ Self-Hosted Deployment (Hostinger KVM VPS)

This app runs as **one long-lived instance** — `next start` under PM2 — on a self-hosted Hostinger KVM VPS at **[leadsnextgencentre.online](https://leadsnextgencentre.online)**, with Nginx reverse-proxying HTTPS traffic to it and every team member's browser pointed at that one public domain. There is no separate database server: all data lives under `leads-dashboard/data/` on the VPS — one JSON file per collection (`members.json`, `tasks.json`, `events.json`, ...) plus `data/uploads/`, which holds the actual bytes of every uploaded document (Design Portal assets, reimbursement receipts) referenced from those JSON records by a `storageKey`.

**Workflow:**
1. Develop and test locally, committing to a feature branch as usual.
2. Push the branch and merge it into `main` once it's ready.
3. On the VPS: `git pull`, `npm install`, `npm run build`, then `pm2 restart leads-dashboard`.
4. Every device — anywhere, not just on a LAN — hits `https://leadsnextgencentre.online`, which Nginx routes to the one running instance sharing the one `data/` directory, so everyone stays in sync automatically.

**Important:** `leads-dashboard/data/` (JSON collections and `uploads/` alike) is git-ignored on purpose — it's live server state, not source code. Only code changes travel through git; nothing under `data/` should ever be committed or deleted on redeploy (`git pull` never touches it, but a careless `rm -rf` on the app directory would). **To back up or restore the app's data, copy the entire `leads-dashboard/data/` directory as one unit** — the JSON records and the uploaded files they reference (`storageKey`) only make sense together; restoring one without the other leaves broken links or orphaned files.

**How live sync works once the server is running:** every open dashboard page polls the server every 7 seconds and re-renders automatically when new data arrives — no manual refresh needed to see a teammate's change. If you ever suspect sync is stuck, see [`docs/bugs-to-fix.md`](docs/bugs-to-fix.md) for the known-issues log and root-cause history of exactly this class of bug.

**Outbound email** (announcements, password resets, task/event notifications) is sent through a local Postfix relay on the VPS, authenticated as a Google Workspace account for `@msruas.ac.in` — the app never holds that credential itself, and passwords in the system are scrypt-hashed, never plaintext (see the Authentication section below).

---

## 🔐 Authentication & Access Level Tiers

Sign-ins are validated server-side (`/api/auth/login`) against the registered members database, with real scrypt-hashed passwords — there is no shared bypass password anymore. Every account starts on a shared temporary password (`Kayo29`) and should be changed from Settings → Account (or via "Forgot Password?" on the login screen) as soon as its owner first logs in.

| Role / Rank | Representative Email | Access Level Tier |
| :--- | :--- | :--- |
| **Super User** | `kayomarz.pavri@msruas.ac.in` | **Tier 1** — Full Operations & Settings Control |
| **Centre Head** | `subhadeep.mukherjee@msruas.ac.in` | **Tier 2** — Member uploads & reimbursement audits |
| **Events Head** | `pallabimund.ms.mc@msruas.ac.in` | **Tier 3** — Event creation and task assignments |
| **Advisory Board** | `sharath.kumar@msruas.ac.in` | **Tier 4** — Read-only performance and rating reviewer |
| **Core Committee** | `gurutejas.c@msruas.ac.in` | **Tier 5** — Operations control, task setup, form builder |
| **Training Associate** | `kunal.bhadauria@msruas.ac.in` | **Tier 6** — Member dashboard, task completion, claim submission |

For the complete roster of all 35 accounts, see [docs/login_creds.md](docs/login_creds.md).

---

## 🛠️ Tech Stack & Key Integrations

- **Frontend**: Next.js (App Router) & TypeScript
- **Styling**: Tailwind CSS v4 & custom space glassmorphism utilities (`globals.css`)
- **State & Theme**: Client-side theme context with localStorage persistence
- **Charts**: Recharts (fully responsive custom graphs and metrics radar)
- **Forms**: Dynamic public feedback builder, QR code preview & poster export, and submissions logger
- **Orchestration**: Direct integration of task workflows, event milestones, and dynamic event-based committees (Logistics, Stage, Food, etc.)

---

## 📄 Documentation Index

For detailed requirements and specs, see the `PROJECT DOCS/files/` directory:
1. [Product Requirements Document (PRD)](PROJECT%20DOCS/files/01-PRD-LEADSDashboard.md)
2. [Sitemap & Route Matrix](PROJECT%20DOCS/files/02-Sitemap-LEADSDashboard.md)
3. [Design System Specification](PROJECT%20DOCS/files/03-DesignSystem-LEADSDashboard.md)
4. [Technical Specification](PROJECT%20DOCS/files/04-TechSpec-LEADSDashboard.md)
5. [Entity-Relationship Diagram & Database Schemas](PROJECT%20DOCS/files/05-DataModel-ERD-LEADSDashboard.md)
6. [Copywriting & Email Alert Templates](PROJECT%20DOCS/files/06-Content-Copy-LEADSDashboard.md)
7. [Reports & Analytics Specs](PROJECT%20DOCS/files/07-ReportsAnalytics-LEADSDashboard.md)

For engineering/ops working docs, see `docs/`:
- [Bug Audit Log](docs/bugs-to-fix.md) — full codebase bug audit with current resolution status per item.
- [Backend Sync Fix — Implementation Spec](docs/changes-needed-for-claude.md) — the spec behind the per-collection API routes, write mutex, and live-sync architecture.
- [Full System Review](docs/recommended-fixes.md) — screen-by-screen review of the dashboard.
- [Login Credentials](docs/login_creds.md) — full 35-account roster with real login access, sorted by tier.
