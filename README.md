# LEADS Next Gen All-in-One Dashboard

This repository contains the private internal operations and management dashboard for the **LEADS Next Gen Centre at MSRUAS, Bengaluru**. It consolidates task traceability, event management, performance evaluation, reimbursement claims, dynamic public form building, and roster management into a single, cohesive portal.

---

## 📂 Project Structure

- **`leads-dashboard/`**: The Next.js (App Router) + TypeScript + Tailwind CSS (v4) project containing the active implementation of the dashboard.
- **`PROJECT DOCS/`**: Curated product specifications, sitemaps, database models, technical specifications, and copywriting guidelines.
- **`REFERENCE DATA/`**: Official Ramaiah University of Applied Sciences leadership directory, hierarchy structure, and references.
- **`login_creds.md`**: Complete roster directory login credentials and testing accounts list.

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

## 🖥️ Self-Hosted Deployment & Multi-Device Sync (TrueNAS)

This app is designed to run as **one long-lived instance** on a self-hosted server (e.g. a TrueNAS box), with every team member's browser — laptops, phones, other machines — pointed at that single instance over the LAN. There is no separate database server: all data lives in one file, `leads-dashboard/data/database.json`, on the host running the app.

**Workflow:**
1. Develop and test locally (Claude Code, Antigravity, or any editor/terminal), committing to a feature branch as usual.
2. Push the branch and merge it into `main` once it's ready.
3. On the TrueNAS box: `git pull`, then rebuild/restart the running instance (`npm run build && npm run start`, or restart the container if it's running in one).
4. Every device on the network hits that one instance's LAN address (e.g. `http://<truenas-ip>:3030`) — because they all share the same server process and the same `data/database.json`, they're automatically in sync with each other.

**Important:** `data/database.json` is git-ignored on purpose — it's live server state, not source code. Only code changes travel through git; the data file should never be committed, and it must persist across redeploys (mount `leads-dashboard/data/` as a persistent TrueNAS dataset so a rebuild doesn't wipe live test data).

**How live sync works once the server is running:** every open dashboard page polls the server every 7 seconds and re-renders automatically when new data arrives — no manual refresh needed to see a teammate's change. If you ever suspect sync is stuck (a change made by one person isn't showing up for another, even though both are pointed at the same server), see [`bugs-to-fix.md`](bugs-to-fix.md) for the known-issues log and root-cause history of exactly this class of bug.

---

## 🔐 Authentication & Access Level Tiers (Testing)

The system dynamically validates sign-ins against the registered members database. You can test different role perspectives using the default password `password123`:

| Role / Rank | Representative Test Email | Access Level Tier |
| :--- | :--- | :--- |
| **Super User** | `kayomarz.pavri@msruas.ac.in` | **Tier 1** — Full Operations & Settings Control |
| **Centre Head** | `subhadeep.mukherjee@msruas.ac.in` | **Tier 2** — Member uploads & reimbursement audits |
| **Events Head** | `pallabi.mund@msruas.ac.in` | **Tier 3** — Event creation and task assignments |
| **Advisory Board** | `sharath.kumar@msruas.ac.in` | **Tier 4** — Read-only performance and rating reviewer |
| **Core Committee** | `gurutejas.c@msruas.ac.in` | **Tier 5** — Operations control, task setup, form builder |
| **Training Associate** | `kunal.bhadauria@msruas.ac.in` | **Tier 6** — Member dashboard, task completion, claim submission |

For a complete index of all 35+ testing accounts, see [login_creds.md](login_creds.md).

---

## 🛠️ Tech Stack & Key Integrations

- **Frontend**: Next.js (App Router) & TypeScript
- **Styling**: Tailwind CSS v4 & custom space glassmorphism utilities (`globals.css`)
- **State & Theme**: Client-side theme context with localStorage persistence
- **Charts**: Recharts (fully responsive custom graphs and metrics radar)
- **Forms**: Dynamic public feedback builder and submissions logger
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
