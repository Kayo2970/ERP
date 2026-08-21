# LEADS Next Gen Centre — Operations & Leadership Portal

An enterprise-grade, institutional management and operations platform designed for the **LEADS Next Gen Centre** at **Ramaiah University of Applied Sciences (MSRUAS)**.

---

## 🚀 Comprehensive Module Breakdown

### 📊 Workspace & Operational Modules

#### 1. Dashboard Home (`/dashboard/home`)
- **Executive Overview**: Centralized operations desk displaying real-time system metrics, active task counters, upcoming event schedules, and recent announcements.
- **Quick Action Hub**: Direct shortcuts for event creation, task assignment, design uploads, and announcement broadcasting.
- **Personal Deliverables**: Tailored dashboard widget highlighting deliverables assigned specifically to the logged-in user.

#### 2. Calendar Module (`/dashboard/calendar`)
- **Inter-Campus Operational Timeline**: Interactive calendar displaying event schedules, sub-committee milestones, and university deadlines.
- **Campus Filtering**: Filter view by **GG Campus**, **RTC Campus**, or **All Campuses**.
- **Event Highlights**: Clickable event cards showing start/end dates, venue details, committee leads, and status badges.

#### 3. Events Desk (`/dashboard/events`)
- **Lifecycle Management**: End-to-end event workflow: *Draft* → *Pending Approval* → *Published* → *Completed*.
- **Sub-Committee Formation**: Create specialized committees (Logistics, Technical, Media, Operations) and assign member rosters.
- **Approval Engine**: Event creation by Executive Council members (President, VP, Chief Coordinator) automatically triggers a Centre Head sign-off requirement.
- **Student Performance Evaluation**: Integrated dual-gate rating system for Centre Head and campus-specific Events Heads.

#### 4. Tasks Desk (`/dashboard/tasks`)
- **Task Delegation**: Assign tasks to individual members or entire sub-committees with priority tagging (*Urgent*, *High*, *Normal*, *Low*).
- **Status Tracking**: Visual progress pipeline: *To Do* → *In Progress* → *Under Review* → *Completed*.
- **Extension Requests**: Assignees can submit task deadline extension requests, which Faculty Advisors or the Centre Head can approve or reject.
- **Executive Task Allotment**: Executive Council task assignments require Event Head approval before activation.

#### 5. Ratings & Student Performance (`/dashboard/ratings`)
- **Rubric Evaluation**: 5-point performance scoring system for student deliverables and leadership contributions.
- **Scoped Visibility**:
  - *Super User / Centre Head*: Universal visibility across all members and campuses.
  - *Department Heads*: Visibility over team members in their department.
  - *Executive Council*: Visibility over own performance and committees they belong to.
  - *Alumni*: Restricted strictly to viewing their own historical performance ratings.

#### 6. Design Portal (`/dashboard/designs`)
- **Asset Review Desk**: Dedicated portal for Design and Social Media department asset requests, proofreading, and approval workflows.
- **Proofreading Pipeline**: Upload design files, assign proofreaders, and manage review decisions (*Approved*, *Revisions Requested*, *Pending Proofread*).
- **Asset Replacements**: Support for uploading updated asset revisions while retaining review logs.
- **Scoped Access**: Restricted to Design Head, Super User, and assigned proofreaders.

---

### 🛡️ Administration & Governance Modules

#### 7. Reimbursements System (`/dashboard/reimbursements`)
- **Expense Claims**: Member expense submission desk with receipt proof attachments and amount validation.
- **Two-Stage Approval Pipeline**:
  - **Stage 1 (Sector Head)**: Initial operational verification.
  - **Stage 2 (Finance Head)**: Final financial audit and reimbursement sign-off.
- **Visibility Isolation**: Claimants view own claims; Sector Heads view all pending Stage 1 claims; Finance Heads view claims only after Stage 1 verification.

#### 8. Budget & Funds (`/dashboard/budget`)
- **Financial Governance**: Ledger for university fund allocations, department budgets, and operational expenditures.
- **Access Scoping**: Restricted strictly to Super User, Centre Head, and Finance Leadership.

#### 9. Public Forms Builder (`/dashboard/forms` & `/forms/[slug]`)
- **Interactive Form Builder**: Custom form creation engine for student signups, feedback collection, and event registrations.
- **Field Customization**: Text inputs, textareas, dropdowns, checkboxes, and file upload fields.
- **Public Form Slugs**: Custom public landing pages rendered at `/forms/[slug]`.
- **Form Protection**: Deletion of public forms is strictly restricted to Centre Head and Super User.

#### 10. Analytics & Reports (`/dashboard/reports`)
- **Executive Report Generator**: Styled PDF report generation and CSV data exports.
- **Report Types**: Performance scorecards, event post-mortems, financial audit summaries, and member activity reports.

#### 11. Announcements Engine (`/dashboard/announcements`)
- **Targeted Broadcasting**: Multi-scope message delivery (`ALL_MEMBERS`, `CORE_COMMITTEE`, `DEPARTMENTS`, `INDIVIDUAL`).
- **Dual Notification**: In-dashboard bell alerts combined with automated Light Mode HTML email dispatch.
- **Authoring Rules**: Allowed for Leadership, Core Committee, and Heads; blocked for Alumni & Executive Council without approval.

#### 12. Member Directory & Roster (`/dashboard/directory`)
- **Central Roster**: Complete roster management covering Advisory Board, Core Committee, Training Associates, and Alumni.
- **Tier & Persona Control**: Manage Tiers 1 through 7, roles, divisions, and departments.
- **Status Controls**: Active vs. Terminated account status toggles.
- **Automated Termination Email**: Terminating a member automatically dispatches an official notification email to their registered address while retaining historical records in the database.
- **Member Protection**: Member removal and termination controls are strictly blocked for Executive Council roles.

#### 13. Guest Directory (`/dashboard/guest-directory`)
- **External Contact Cards**: Directory for visiting guests, external VIPs, faculty advisors, and industry partners.
- **Access Scoping**: View and add contacts allowed for Executive Council, Centre Head, and Faculty; contact deletion restricted to Centre Head and Super User.

#### 14. Guest Invites Dispatcher (`/dashboard/guest-invites`)
- **Mass Email Dispatcher**: Batch invitation engine for official events and guest communications.
- **Mail-Merge Engine**: Dynamic placeholder substitution (`{{name}}`, `{{email}}`, `{{role}}`).
- **Delivery Monitoring**: Progress tracking bar with real-time success and failure reporting.

#### 15. Dynamic Group Policies (`/dashboard/policies`)
- **Granular RBAC Engine**: Super User authority to grant any of 15 capability keys (`EVENTS_CREATE`, `TASKS_EDIT`, `EDIT_DIRECTORY`, `BUILD_FORMS`, etc.).
- **Targeting Matrix**: Target by Member ID, Division, Tier, or Designation Keyword.
- **Approval Gateways**: Configure optional approval sign-offs (Centre Head, specific member, policy tag holder).
- **Scope Restrictions**: Apply `OWN_ONLY` visibility restrictions to specific users or tiers.

#### 16. Backup & Restore (`/dashboard/backup`)
- **Database Snapshot Manager**: Export complete system state to formatted JSON backup files.
- **System Restoration**: Restore database state with validation checks, rollback protection, and backup history logs.

#### 17. Email Management & Client (`/dashboard/email`)
- **SMTP Client Configuration**: Configure Nodemailer for Google Workspace SMTP, Local Postfix, or Custom SMTP.
- **Diagnostics & Testing**: Live connection verification tool with instant test mail delivery.
- **Dispatch Logs**: Detailed audit log of all sent and failed email notifications.
- **Master Light Mode Template Engine**: Centralized HTML email wrapper styling.

#### 18. System & Account Settings (`/dashboard/settings`)
- **Personal Profile**: Profile customization, password updates, and avatar settings.
- **Secure Email Update**: Updating login email sends a 5-minute OTP code to the CURRENT email inbox for security verification.
- **Emergency System Lockdown**: Super User toggle to lock the dashboard site-wide (renders plain 404 for non-admin session attempts).

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

## 🎨 UI Aesthetics & Light Mode Styling

- **Isometric Light Mode Background**: Custom geometric isometric cube background image (`/images/light-bg.jpg`) rendered fixed across Light Mode layout ([`src/app/globals.css`](file:///Users/kayo/ERP/leads-dashboard/src/app/globals.css)).
- **Fast Module Transitions**: Optimized 1-second (1000ms) transition animations between workspace modules.
- **Master Light Mode Email Template**: Institutional HTML email wrapper with clean white cards (`#ffffff`), soft slate borders (`#e2e8f0`), LEADS institutional blue accents (`#0284c7`), and dark slate body text (`#0f172a`, `#334155`) ([`src/lib/email-service.ts`](file:///Users/kayo/ERP/leads-dashboard/src/lib/email-service.ts)).

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
