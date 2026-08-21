# LEADS Next Gen Centre — Operations & Leadership Portal

An enterprise-grade, institutional management and operations platform designed for the **LEADS Next Gen Centre** at **Ramaiah University of Applied Sciences (MSRUAS)**.

---

## 🚀 Key Modules & System Features

### 📊 Workspace & Operations
- **Dashboard Home**: High-level operational metrics, active task counts, upcoming event schedules, and recent announcements.
- **Calendar & Events**: Comprehensive event management with campus scoping (**GG Campus** & **RTC Campus**), sub-committee assignments, and student performance evaluation tools.
- **Tasks Desk**: Individual and committee task delegation, due-date tracking, progress milestones, and extension request approvals.
- **Ratings & Evaluation**: Dual-gate student performance evaluation (Centre Head & Events Head authority) for event deliverables and leadership contributions.
- **Design Portal**: Asset submission, proofreading workflow, status reviews, and version management for design & social media collateral.

### 🛡️ Administration & Governance
- **Reimbursement Claims**: Two-stage approval pipeline (Stage 1: Sector Head review; Stage 2: Finance Head final sign-off).
- **Budget & Funding**: Financial management, allocation tracking, and expenditure monitoring for approved operations.
- **Public Forms & Announcements**: Form builder for student engagement, plus multi-scope targeted announcement broadcasting.
- **Directory & Roster**: Centralized member directory with tier hierarchy management, status controls (Active, Terminated, Reactivated), and automated email notifications.
- **Guest Directory**: Visiting contact cards, faculty advisory records, and guest event invites.
- **Dynamic Group Policies**: 15 grantable capability keys (`EVENTS_CREATE`, `TASKS_EDIT`, `EDIT_DIRECTORY`, etc.) with customizable approval gateways and visibility scopes.
- **Email Management & SMTP Client**: Integrated Nodemailer engine with diagnostic health checks, log tracking, and master institutional light-mode HTML wrappers.

---

## 🔐 Permission Hierarchy & Role-Based Access Control (RBAC)

The system enforces a multi-tiered permission model backed by dynamic policy grants ([`src/lib/permissions.ts`](file:///Users/kayo/ERP/leads-dashboard/src/lib/permissions.ts)):

| Tier / Role | Authority Scope & Access Level |
| :--- | :--- |
| **Tier 1 — Super User** | Complete root system authority, policy management, audit logging, impersonation, and bypass access. |
| **Tier 2 — Centre Head** | Universal oversight across all campuses, final reimbursement sign-off, announcement approval, and evaluation authority. |
| **Tier 2.5 — GG Events Head** | Cross-campus access: full view, edit, and evaluation authority over both **GG Campus** and **RTC Campus** events. |
| **Tier 3 — Events Head & Advisory** | Event & task management, campus-restricted student evaluation (RTC Events Head manages RTC Campus only). |
| **Tier 4–5 — Core Committee** | Executive Council (President, Vice President, Gen Secs) & Dept Heads. Event creation requires **Centre Head approval**; Task allotment requires **Event Head approval**. Member termination is strictly blocked. |
| **Tier 6 — Training Associates** | Operational execution (view assigned tasks/events, submit design assets, request task extensions). |
| **Tier 7 — Alumni** | Read-only student view for calendar, event overviews, own performance ratings, past reimbursements, and profile settings. |

---

## 📧 Email Notification Engine & Light Mode Styling

All system notifications use the **Master Institutional Light Mode HTML Wrapper** ([`src/lib/email-service.ts`](file:///Users/kayo/ERP/leads-dashboard/src/lib/email-service.ts)):
- **Light Theme Palette**: Clean white container (`#ffffff`), soft slate borders (`#e2e8f0`), LEADS institutional blue branding (`#0284c7`), and dark slate body text (`#0f172a`, `#334155`).
- **Automated Templates**:
  - Password Reset & Email Change 5-minute OTP verifications.
  - Announcement broadcasting.
  - Task assignment notifications.
  - Event committee roster additions.
  - Automated member termination notices.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router, Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org) (Strict type checking)
- **Styling**: Vanilla CSS & TailwindCSS v4 with custom glassmorphism effects (`.glass-panel`)
- **Icons**: [Lucide React](https://lucide.dev)
- **Email Engine**: [Nodemailer](https://nodemailer.com) with custom HTML templates

---

## 💻 Getting Started

### Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type Verification

```bash
# Run TypeScript compilation check
npx tsc --noEmit
```

---

## ⚖️ Intellectual Property & Licensing Notice

All Intellectual Property, Copyrights, Development Licensing, and Proprietary System Architecture belong exclusively to **Kayomarz Pavri**. Unauthorized copying, distribution, or reproduction of this codebase or its custom components is strictly prohibited.

© 2026 LEADS Next Gen Centre &middot; MSRUAS Internal Operations Portal. All rights reserved.
