# LEADS Next Gen Centre — Operations & Leadership Portal

An enterprise-grade, institutional management and operations platform designed for the **LEADS Next Gen Centre** at **M.S. Ramaiah University of Applied Sciences (MSRUAS)**.

> See the [repository root README](../README.md) for the full project structure, environment variables, and a detailed changelog. This file covers the app itself.

---

## 🖥️ Production Deployment

Runs on **AWS EC2** (`ap-south-1`) under **PM2** (`leads-dashboard`, `next start -p 3030`), served at **[portal-leads.msruas.ac.in](https://portal-leads.msruas.ac.in)** through an AWS Application Load Balancer. Administered via AWS Systems Manager Session Manager (no direct SSH).

```bash
cd /home/ssm-user/ERP/leads-dashboard
git pull origin main
npm install
npm run build
pm2 restart leads-dashboard
```

> Previously hosted on a Hostinger KVM VPS at `leadsnextgencentre.online` — that domain is now a stale, unrelated deployment and should not be used for anything expected to reach the live app.

---

## 🚀 Comprehensive Module Breakdown

### 📊 Workspace & Operational Modules

#### 1. Dashboard Home (`/dashboard/home`)
- **Executive Overview**: Centralized operations desk featuring greetings, designation breakdowns, active task counters, upcoming event schedules, and recent announcements.
- **Cross-Module Project Timeline (Gantt)**: Event bars plotted against start/end dates with task markers at due dates. Interactive 2-Weeks / 30-Days / 90-Days window toggle with auto-widening fallback and lead-in planning phase segments.
- **Quick Action Hub**: Shortcuts for event creation, task assignment, design uploads, and announcement broadcasting.
- **Personal Deliverables**: Tailored dashboard widget highlighting deliverables assigned to the current user.

#### 2. Calendar Module (`/dashboard/calendar`)
- **Inter-Campus Operational Timeline**: Interactive calendar displaying event schedules, sub-committee milestones, and university deadlines.
- **Planning-Phase Markers**: Distinct amber indicator for pre-event planning windows (Planning Start Date up to actual Start Date).
- **Campus Filtering**: Filter view by **GG Campus**, **RTC Campus**, or **All Campuses**.

#### 3. Events Desk (`/dashboard/events`)
- **Lifecycle Management**: End-to-end event workflow: *Draft* → *Pending Approval* → *Published* → *Completed*.
- **Planning Start Date vs. Event Date**: Tracks prep work start date separately from on-ground dates.
- **Status Filter Tabs**: Filter by *All Events*, *Ongoing*, *Completed*, or *Archived*.
- **Sub-Committee Formation**: Create specialized committees (Logistics, Technical, Media, Operations).
- **Approval Engine**: Executive Council event creations trigger Centre Head sign-off requirements.
- **Festivals & Observances**: Synced national holidays require explicit social media post sign-off (`holiday_social_approval`).
- **No Default Committees**: new events start with zero sub-committees instead of 3 auto-seeded ones.

#### 4. Tasks Desk (`/dashboard/tasks`)
- **Task Delegation**: Assign tasks to individuals or sub-committees with priority tagging (*Urgent*, *High*, *Normal*, *Low*).
- **Searchable Combobox Filters**: Type-to-search assignee and event filter dropdowns.
- **Status Tracking**: Visual pipeline: *To Do* → *In Progress* → *Under Review* → *Completed*.
- **Auto-Generated Design Tasks**: Finalized Design Portal submissions automatically create or complete tasks.
- **Extension Requests**: Assignees can request deadline extensions subject to Advisor or Centre Head approval.

#### 5. Ratings & Student Performance (`/dashboard/ratings`)
- **Multi-Reviewer Independent Rubric**: 4-way independent leadership evaluation rubric (**Super User**, **Centre Head**, **Advisor**, and **GG Campus Events Head**).
- **Live Aggregate Averaging**: Reviews submitted by any panel member automatically compute into a live composite average score.
- **Design Evaluation Lane**: Dedicated evaluation slot for the Design Head on creative deliverables.
- **Searchable Combobox Filters**: Quick search filters for students and events with custom monthly or date-range filtering.

#### 6. Approvals & Governance Desk (`/dashboard/approvals`)
- **Centralized Approvals Inbox**: Dedicated management hub for pending sign-offs across Announcements, Tasks, Events, Designs, Event Reports, Members, and Committees.
- **In-Card Rich Overview Previews**: Each card includes an immediate preview snippet (announcement scope & message body, task brief & due date, event dates & venue, design thumbnail & category, report file specs).
- **Interactive Deep Overview Modal**: One-click modal inspection showing un-truncated content bodies, attachments, requester messages, and embedded **Approve / Reject** buttons with optional decision notes.
- **Multi-Panel Auto-Sync**: Sibling requests for Centre Head, Advisor, and GG Events Head automatically resolve when any panel member decides.

#### 7. Design Portal (`/dashboard/designs`)
- **Asset Review Desk**: Dedicated portal for Design and Social Media department asset requests, proofreading, and approval workflows.
- **Dual Review Pipeline**:
  - *Proofreading Gate*: Assign proofreaders with change requests or plain approval.
  - *Style Approval Gate*: Final Design Head / Centre Head sign-off.
- **Asset Management**: File uploads with image previews, OCR text scanning, and automated completed task synchronization.
- **Design Task Requests Queue**: Design-brief Tasks awaiting a submission surface here for whoever they're assigned to, including committee assignments.

#### 8. Event Passes & Gate QR Scanner (`/dashboard/event-passes`)
- **Digital Event Passes**: High-resolution event pass cards with unique serial numbers, security QR codes, and automated email dispatch with pass attachments.
- **Gate QR Scanner**: Integrated in-app camera scanner for event security and coordinators with authenticated instant validation.
- **Pass Governance**: Re-send pass emails, revoke invalid passes, or delete records.

#### 9. Digital Visiting Card & Wallet Passes (`/dashboard/visiting-card` & `/card/[slug]`)
- **Public Visiting Card**: Dynamic `/card/[slug]` landing page featuring member profile, designation, direct phone/LinkedIn links, and instant VCF vCard download.
- **Interactive Image Cropper**: Multi-aspect ratio image cropping modal with zoom, pan, and centering controls for avatars and visiting cards.
- **Apple & Google Wallet Passes**: Automated wallet pass generation via WalletWallet API with QR codes, caching, and rate-limited regeneration (2 per 15-day window). Logo/photo URLs now point at the live production domain rather than a stale pre-migration one.

---

### 🛡️ Administration & Governance Modules

#### 10. Reimbursements System (`/dashboard/reimbursements`)
- **Expense Claims**: Expense submission desk with receipt proof attachments and amount validation.
- **Two-Stage Approval Pipeline**: Stage 1 (Sector Head) verification followed by Stage 2 (Finance Head) sign-off.

#### 11. Budget & Funds (`/dashboard/budget`)
- **Financial Governance**: Ledger for university fund allocations, department budgets, and operational expenditures.
- **Smart Sponsorship Calculation Engine**:
  - *Sponsor Depletion First*: Event expenses deplete sponsor funds before touching the Centre's allocation.
  - *Sponsor Surplus Return Rule*: Unused event sponsorship returns to the Centre's main account.
  - *Total Available Capital*: Real-time formula: `Annual Approved Budget + General Income/Grants + Returned Sponsor Surplus`.
- **Multi-Year Budgeting Engine**: Extended 9-year Financial Year selector (`-5` years back to `+3` years forward).

#### 12. Public Forms Builder (`/dashboard/forms` & `/forms/[slug]`)
- **Interactive Form Builder**: Custom form engine for student signups, feedback collection, and event registrations.
- **Instant QR Code & Poster Download**: Generates high-res printable poster PNG cards with branding header and scannable QR code.
- **Official Word (DOCX) Export**: Built-in Feedback Form template generates field-for-field filled copies matching `Feedback_Events.docx`.

#### 13. Analytics & Reports (`/dashboard/reports`)
- **Executive Report Generator**: Styled PDF report generation and CSV data exports for scorecards, event post-mortems, and financial audits.

#### 14. Announcements Engine (`/dashboard/announcements`)
- **Targeted Broadcasting**: Multi-scope broadcasting (`ALL_MEMBERS`, `CORE_COMMITTEE`, `DEPARTMENTS`, `INDIVIDUAL`).
- **Dual Notification**: In-dashboard alerts paired with Light Mode HTML emails.

#### 15. Member Directory & Roster (`/dashboard/directory`)
- **Central Roster**: Complete roster management covering Advisory Board, Core Committee, Training Associates, and Alumni across Tiers 1–7.
- **Bulk CSV Importer**: Template-based batch member creation.
- **Account Termination Engine**: Requires typed reason and dispatches automated termination notification emails.
- **Add/Remove Hard-Locked**: Restricted to Centre Head, Advisor, and Super User — not delegable via Group Policy.
- **New Designations**: Faculty Ambassador (Core Committee/Advisory Board) and Chief Advisor (Faculty, view-only).
- **"Pending Activation / Reset" Filter Tab** and **auto-capitalized names** on entry.
- **Promotion/Demotion Notice**: a tier change now pops up a notice either direction.

#### 16. Guest Directory (`/dashboard/guest-directory`)
- **External VIP Directory**: Directory for guest speakers, VIPs, and corporate contacts with CSV bulk import.

#### 17. Mail Merge (`/dashboard/guest-invites`)
- Renamed from "Guest Invites" — same route and permission keys, display-only rename.
- **Mass Email Dispatcher**: Batch invitation engine with mail-merge placeholders (`{{name}}`, `{{email}}`, `{{role}}`) and live delivery progress bar.
- **File Attachments**: Attach files (15MB cap) sent to every recipient in the batch.

#### 18. Dynamic Group Policies (`/dashboard/policies`)
- **Granular RBAC Engine**: Super User capability grants across 15 privilege keys with division/tier targeting, `Select All` controls, and approval gateways.

#### 19. Backup & Restore (`/dashboard/backup`)
- **Snapshot Manager**: Export and restore AES-256 encrypted JSON database snapshots with rollback protection.

#### 20. Email Management & Client (`/dashboard/email`)
- **SMTP Engine**: Diagnostic testing, live queue monitoring, test email delivery, and dispatch logs.
- **File Attachments** on the Broadcast Composer, same as Mail Merge.
- **Debounced Task-Assignment Digest**: batches task-assignment emails per recipient over a 10-minute window — now fires correctly for tasks created automatically by the in-process schedulers, not just ones created via the Tasks page.

#### 21. System & Account Settings (`/dashboard/settings`)
- **Profile & Security**: Avatar upload, OTP-verified email updates, password change, and Super User Emergency System Lockdown.

---

## 🔐 Access Level Tiers & Privileges Matrix

| Tier | Role Title | Typical Division | Core Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Super User** | Core Committee | Complete root authority, quick switch impersonator, emergency lockdown, global audit logs, backup/restore. |
| **Tier 2** | **Centre Head** | Faculty | University-wide authority, budget sign-off, Level-2 reimbursement clearance, email broadcasts, roster management. |
| **Tier 2.5** | **GG Campus Head** | Faculty | Regional operational authority for GG Campus; cross-campus oversight and evaluation authority for both GG and RTC events. |
| **Tier 3** | **Faculty / Event Heads** | Faculty | Event approval, Level-1 reimbursement audit, task delegation, and student performance ratings. |
| **Tier 4** | **Advisory Board** | Faculty | Multi-reviewer evaluation participation, institutional analytics, event summaries, and report viewing. |
| **Tier 5** | **Core Committee** | Core Committee | Executive Council (President & VP) platform-wide task oversight; event creation (requires Centre Head approval), task allotment. |
| **Tier 6** | **Training Associates** | Training Associate | Task execution, status updates, personal deliverables, expense claim submissions. |
| **Tier 7** | **Alumni / Guests** | Alumni / Guest | Read-only access to past event records, personal ratings, digital visiting cards, and profile settings. |

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org) (Strict type checking)
- **Styling**: Vanilla CSS & TailwindCSS v4 with custom glassmorphism effects (`.glass-panel`)
- **Icons**: [Lucide React](https://lucide.dev)
- **Cryptography**: AES-256-GCM, scrypt, PBKDF2
- **Email Engine**: [Nodemailer](https://nodemailer.com) with custom HTML templates
- **Passes & QR**: WalletWallet Apple/Google Pass integration, jsQR, qrcode, canvas image cropper

---

## 💻 Getting Started

### Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3030](http://localhost:3030) in your browser.

### Type Verification

```bash
# Run TypeScript compilation check
npx tsc --noEmit
```

---

## ⚖️ Intellectual Property & Licensing Notice

All Intellectual Property, Copyrights, Development Licensing, and Proprietary System Architecture belong exclusively to **Kayomarz Pavri**. Unauthorized copying, distribution, or reproduction of this codebase or its custom components is strictly prohibited.

© 2026 LEADS Next Gen Centre &middot; MSRUAS Internal Operations Portal. All rights reserved.
