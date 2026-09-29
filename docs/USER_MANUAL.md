# LEADS ERP — User Operations & Privileges Manual

> **Version:** 2.0 Production  
> **Platform:** LEADS Next Gen Centre ERP Operations Portal  
> **Institution:** M.S. Ramaiah University of Applied Sciences (MSRUAS)  
> **Target Audience:** Students, Training Associates, Committee Leads, Faculty Advisors, Department Heads, and Super Users.

---

## Table of Contents

1. [Welcome & Getting Started](#1-welcome--getting-started)
   - [1.1 Platform Overview](#11-platform-overview)
   - [1.2 Architecture & File System Locations](#12-architecture--file-system-locations)
   - [1.3 The Master Encryption Key (DATA_ENCRYPTION_KEY)](#13-the-master-encryption-key-data_encryption_key)
   - [1.4 Interactive Super User Seeding (npm run setup)](#14-interactive-super-user-seeding-npm-run-setup)
   - [1.5 Environment Configuration File (.env) Reference](#15-environment-configuration-file-env-reference)
   - [1.6 Production VPS Deployment & Continuous Pipeline](#16-production-vps-deployment--continuous-pipeline)
   - [1.7 First-Time Account Activation & Password Setup](#17-first-time-account-activation--password-setup)
   - [1.8 Mobile / PWA Installation (iOS & Android)](#18-mobile--pwa-installation-ios--android)
   - [1.9 Interface Layout & Navigation Shell](#19-interface-layout--navigation-shell)
2. [Role Privileges & Access Hierarchy](#2-role-privileges--access-hierarchy)
   - [Understanding Tiers 1 through 7](#21-understanding-tiers-1-through-7)
   - [Role Matrix Summary](#22-role-matrix-summary)
   - [Super User Quick Switch (Persona Switcher)](#23-super-user-quick-switch-persona-switcher)
3. [Module-by-Module Operating Instructions](#3-module-by-module-operating-instructions)
   - [3.1 Home Dashboard](#31-home-dashboard)
   - [3.2 Events Management](#32-events-management)
   - [3.3 Event Passes & Live Scanner Kiosk](#33-event-passes--live-scanner-kiosk)
   - [3.4 Apple Wallet & Google Wallet Integration](#34-apple-wallet--google-wallet-integration)
   - [3.5 Task Management, Delegation & Gantt Timeline](#35-task-management-delegation--gantt-timeline)
   - [3.6 Performance Ratings & Committee Evaluation](#36-performance-ratings--committee-evaluation)
   - [3.7 Procurement & Equipment Requisitions](#37-procurement--equipment-requisitions)
   - [3.8 Financial Reimbursements & Multi-Gate Audit](#38-financial-reimbursements--multi-gate-audit)
   - [3.9 Budgeting, P&L & Income Sources](#39-budgeting-pl--income-sources)
   - [3.10 Design Portal, Proofreading & OCR Spellcheck](#310-design-portal-proofreading--ocr-spellcheck)
   - [3.11 Dynamic Form Builder & Public Submissions](#311-dynamic-form-builder--public-submissions)
   - [3.12 Digital Visiting Cards & 3D Interactive Keycard](#312-digital-visiting-cards--3d-interactive-keycard)
   - [3.13 Guest Directory & VIP Invitation Engine](#313-guest-directory--vip-invitation-engine)
   - [3.14 Announcements & Scoped Broadcasts](#314-announcements--scoped-broadcasts)
   - [3.15 Master Calendar & Festival Schedule](#315-master-calendar--festival-schedule)
   - [3.16 Executive Event Reports & PDF/Word Exports](#316-executive-event-reports--pdfword-exports)
   - [3.17 Unified Approvals Inbox](#317-unified-approvals-inbox)
   - [3.18 Members Directory & Account Provisioning](#318-members-directory--account-provisioning)
   - [3.19 Custom Group Policies & Access Thresholds](#319-custom-group-policies--access-thresholds)
   - [3.20 Email Delivery Engine & Queue Logs](#320-email-delivery-engine--queue-logs)
   - [3.21 System & Security Settings](#321-system--security-settings)
   - [3.22 Encrypted Backup & Restore](#322-encrypted-backup--restore)
4. [Step-by-Step Workflows by Role](#4-step-by-step-workflows-by-role)
   - [For Students / Training Associates (Tiers 5-6)](#41-for-students--training-associates-tiers-5-6)
   - [For Event Organizers & Committee Leads (Tiers 3, 5)](#42-for-event-organizers--committee-leads-tiers-3-5)
   - [For Faculty Advisors & Department Heads (Tiers 2-4)](#43-for-faculty-advisors--department-heads-tiers-2-4)
   - [For Centre Head & Executive Leadership (Tier 2)](#44-for-centre-head--executive-leadership-tier-2)
   - [For System Administrators (Tier 1 Super User)](#45-for-system-administrators-tier-1-super-user)
5. [Troubleshooting & Frequently Asked Questions](#5-troubleshooting--frequently-asked-questions)

---

## 1. Welcome & Getting Started

### 1.1 Platform Overview
The **LEADS ERP** is an all-in-one operations portal developed specifically for the LEADS Next Gen Centre at M.S. Ramaiah University of Applied Sciences. It unifies institutional event planning, task tracking, multi-tier financial governance, digital credentials, dynamic form collection, and committee evaluations into a fast, reactive web application.

Key architectural benefits:
- **Zero Cloud Database Dependency**: Your data is encrypted at rest using industry-standard AES-256-GCM directly on institutional servers.
- **Cross-Device Reactive Sync**: When an organizer updates a task or clears a reimbursement on one computer, all active devices pick up the change within 7 seconds automatically.
- **Role-Gated Privacy**: Information is strictly segmented based on student, faculty, and administrative tiers.

---

### 1.2 Architecture & File System Locations
The LEADS ERP runs entirely on local, sovereign server storage without third-party cloud database subscriptions. All student records, bank accounts, UPI IDs, event financials, and receipts are encrypted on disk.

#### File & Directory Reference ("Where Files Live"):
| Directory / File Path | Purpose & Storage Classification |
|---|---|
| `leads-dashboard/.env` | **Environment Configuration File:** Holds the master encryption key, session secret, port, and institutional SMTP credentials. Git-ignored and strictly confidential. |
| `leads-dashboard/.env.example` | **Template Schema:** Reference blueprint containing all permissible environment variables. |
| `leads-dashboard/data/` | **Encrypted Data Directory:** Houses all encrypted JSON collections: `members.json`, `events.json`, `tasks.json`, `reimbursements.json`, `sessions.json`, and `systemSettings.json`. |
| `leads-dashboard/scripts/setup-superuser.js` | **Interactive Provisioning CLI:** Bootstrap utility executed via `npm run setup` to create the initial founding administrator. |
| `docs/vps-setup.sh` | **Automated Server Bootstrap:** Installs Node 22 LTS, PM2, Git, Nginx, Certbot SSL on a clean Ubuntu VPS. |
| `deploy.sh` | **Zero-Downtime Continuous Deployment:** Automates Git sync, dependency checks, production compilation, and PM2 reload. |

---

### 1.3 The Master Encryption Key (DATA_ENCRYPTION_KEY)
Every sensitive record committed to disk is ciphered using **AES-256-GCM** (Galois/Counter Mode) authenticated encryption:
- **Entropy Format:** A 64-character hexadecimal string representing 32 bytes (256 bits) of cryptographic entropy.
- **Key Derivation Function (PBKDF2):** At runtime, the server derives the active cipher key using:
  ```javascript
  crypto.pbkdf2Sync(MASTER_KEY, 'LEADS_NEXT_GEN_CENTRE_MSRUAS_SALT_2026', 100000, 32, 'sha256')
  ```
  The 100,000 iterations ensure resilience against GPU-accelerated dictionary and rainbow table attacks.
- **Payload Schema:** Every database file in `data/` contains:
  ```json
  {
    "_encrypted": true,
    "algorithm": "aes-256-gcm",
    "iv": "<12-byte hex IV>",
    "authTag": "<16-byte hex authentication tag>",
    "ciphertext": "<hex-encoded encrypted payload>"
  }
  ```

> **⚠️ Critical Security Warning:** If `DATA_ENCRYPTION_KEY` in `.env` is deleted or corrupted, existing database files **cannot be decrypted by anyone**. Always maintain an offline physical backup of this 64-character string in an institutional security vault.

---

### 1.4 Interactive Super User Seeding (npm run setup)
To initialize a fresh instance without default passwords or hardcoded test accounts, execute the interactive setup CLI from the `leads-dashboard` directory:

```bash
cd leads-dashboard
npm run setup
```

The CLI steps through the initial administrator provisioning prompts:

#### Prompt 1: Administrator Full Name
- **Console Prompt:** `Full name:`
- **What to enter:** The formal administrative name of the founding Super User (e.g. `<Administrator Full Name>` or institutional title).
- **Validation:** Cannot be empty. Trims whitespace automatically.

#### Prompt 2: Institutional Email Address
- **Console Prompt:** `Email address:`
- **What to enter:** The primary administrative login email (e.g. `<admin@institution.edu>`).
- **Validation:** Normalized to lowercase; strictly validated against RFC 5322 email syntax.

#### Prompts 3 & 4: Master Password & Confirmation
- **Console Prompt:** `Password (min 8 characters):` followed by `Confirm password:`
- **Input Security:** The terminal switches to raw mode (`process.stdin.setRawMode(true)`). Keypresses are completely hidden and never echoed to the terminal.
- **Validation:** Must be at least 8 characters. You are provided 3 attempts to confirm matching credentials.
- **Hashing Algorithm:** Passwords are never stored plaintext; they are hashed via `crypto.scryptSync(plain, salt, 64)` using an individual 16-byte cryptographic salt.

#### Prompt 5: Master Encryption Key (DATA_ENCRYPTION_KEY)
- **Console Prompt:**
  ```text
  --- Data encryption key ---
  No DATA_ENCRYPTION_KEY is set yet. This is the key that encrypts every record this
  app stores on disk.
  Press Enter to generate a strong random key (recommended), or paste your own:
  ```
- **Option A (Recommended - Press Enter):** Automatically generates 32 cryptographically secure random bytes via `crypto.randomBytes(32).toString('hex')` yielding a 64-character hex key.
- **Option B (Paste Custom Key):** Paste a pre-existing 64-character hex key from your institutional key vault.
- **Outcome:** The utility writes `DATA_ENCRYPTION_KEY=<key>` into `leads-dashboard/.env`, provisions the root administrator (`id: "m1"`, `role: "Super User"`, `tier: 1`), and writes the encrypted payload to `data/members.json`.

---

### 1.5 Environment Configuration File (.env) Reference
The runtime environment is configured via `leads-dashboard/.env`:

| Environment Variable | Default / Example Value | Description & Purpose |
|---|---|---|
| `DATA_ENCRYPTION_KEY` | `<64_hex_characters>` | **Mandatory:** Master 256-bit AES-GCM encryption key for local collections. |
| `SESSION_SECRET` | `<random_hex_string>` | Secret key used for signing HMAC authentication session tokens. |
| `PORT` | `3030` | Local HTTP port bound by the Next.js server. |
| `NODE_ENV` | `production` / `development` | Toggles production optimizations, caching, and secure HTTP-only cookies. |
| `APP_URL` | `http://localhost:3030` | Base public URL used when generating pass QR codes and activation email links. |
| `SMTP_HOST` | `smtp.gmail.com` | Outbound institutional SMTP relay host. |
| `SMTP_PORT` | `587` (STARTTLS) or `465` (SSL) | SMTP communication port. |
| `SMTP_USER` | `<notifications@institution.edu>` | Outbound mail service authentication username. |
| `SMTP_PASS` | `<16_char_app_password>` | Application-specific password from Google Workspace or Microsoft 365. |
| `SMTP_FROM` | `"LEADS Centre" <notifications@institution.edu>` | Outbound sender name and email displayed in recipient inboxes. |

---

### 1.6 Production VPS Deployment & Continuous Pipeline

#### 1. Automated VPS Server Bootstrap (`vps-setup.sh`)
On a freshly provisioned Ubuntu 22.04 or 24.04 LTS server, run the automated setup script with root privileges:
```bash
sudo bash /ERP/docs/vps-setup.sh
```
This automated runbook:
1. Updates package repositories (`apt update && apt upgrade`).
2. Installs Node.js 22 LTS, PM2 Process Manager, Git, Nginx, and Certbot.
3. Configures an Nginx reverse-proxy routing port `80`/`443` to local port `3030`.
4. Provisions Let's Encrypt SSL/TLS certificates with auto-renewal.
5. Launches `npm run setup` to seed the root administrator.
6. Sets up systemd service auto-start on server boot.

#### 2. Continuous Deployment Pipeline (`deploy.sh`)
Whenever production code updates are pushed to GitHub, run the zero-downtime deployment script:
```bash
bash deploy.sh
```
**Pipeline Execution Steps:**
1. `git pull origin main`: Synchronizes verified code updates.
2. `npm install`: Updates npm package dependencies.
3. `npm run build`: Compiles optimized Next.js server and client bundles.
4. `pm2 reload leads-dashboard`: Triggers a zero-downtime hot reload of the Node.js process.

---

### 1.7 First-Time Account Activation & Password Setup
Accounts are provisioned by the Administrator or Department Head through the **Members Directory**. Users do not self-register from a public signup form.

1. **Receive Activation Email**: When your profile is created, you receive an automated email containing your unique, single-use activation link.
2. **Open Activation Link**: Click the link (e.g., `https://leads.msruas.ac.in/activate?token=...`).
3. **Set Password**:
   - Must be at least **8 characters** in length.
   - Recommended: Include uppercase, lowercase, numbers, and symbols.
4. **Confirm Profile Details**: Verify your Department, Role, and Phone Number.
5. **Log In**: Navigate to the Login screen with your institutional email and new password.

> **Tip:** If your activation link expires or is lost, contact your administrator to click **Resend Activation Link** from the Members Directory.

---

### 1.8 Mobile / PWA Installation (iOS & Android)
LEADS ERP is an installable Progressive Web Application (PWA). You can install it directly onto your phone's home screen for a full-screen, native app feel:

- **Apple iOS (Safari)**:
  1. Open the ERP URL in Safari.
  2. Tap the **Share** button (box with an arrow pointing up).
  3. Scroll down and tap **Add to Home Screen**.
  4. Tap **Add**. The LEADS icon will appear on your home screen.
- **Android (Chrome)**:
  1. Open the ERP URL in Google Chrome.
  2. Tap the three dots menu in the top right corner.
  3. Tap **Install app** or **Add to Home screen**.
  4. Confirm by tapping **Install**.

---

### 1.9 Interface Layout & Navigation Shell
Once logged in, the application interface provides:

1. **Collapsible Sidebar (Left)**: Houses navigation links to all modules permitted for your tier. Clicking the collapse button tucks the sidebar into compact icon mode.
2. **Top Application Bar**:
   - **Page Title**: Current view and status.
   - **Date Range / Period Filter**: Globally filters events, tasks, and financials (All Time, This Month, Last 90 Days, Academic Year).
   - **Quick Switcher (Super User only)**: Allows administrators to view the interface as any active member.
   - **User Menu**: Shows your profile picture, active role badge, settings, and Sign Out button.
3. **Main Content Canvas**: Fast, responsive workspace with zero full-page reloads.

---

## 2. Role Privileges & Access Hierarchy

### 2.1 Understanding Tiers 1 through 7
Access rights in LEADS ERP are governed by a 7-tier hierarchical model combined with organizational divisions:

| Tier | Role Title | Typical Division | Core Authority |
|:---:|:---|:---|:---|
| **Tier 1** | **Super User** | Core Committee | Unrestricted administrative control, system settings, global audit logs, emergency lockdown, encrypted backups, and persona switching. |
| **Tier 2** | **Centre Head** | Faculty | Executive operational authority across campuses, final budget approvals, Level-2 reimbursement clearance, and VIP guest directory oversight. |
| **Tier 3** | **Department Head / Event Lead** | Faculty / Core | Directs designated departments (Events, Logistics, Media, Stage, etc.). Approves event proposals, conducts Level-1 reimbursement audits, assigns tasks. |
| **Tier 4** | **Advisory Board / Faculty Advisor** | Faculty / Advisory | High-level consultative read access to institutional performance analytics, committee ratings, and event summaries. |
| **Tier 5** | **Core Committee Members** | Core Committee | Operational execution: event creation, task allocation, event passes studio, design review submissions, and form creation. |
| **Tier 6** | **Training Associates / Student Members** | Training Associate | Personal workspace: task execution and status reporting, personal reimbursement claim submissions, and digital visiting card generation. |
| **Tier 7** | **Alumni / External Guests** | Alumni / Guest | Read-only access to relevant past event archives, visiting card exchanges, and public event passes. |

---

### 2.2 Master Designation x Module Privileges Matrix

The comprehensive matrix below defines the exact operational authority of every institutional role across the 24 workspace modules:

| Module / Route | Super User (T1) | Centre Head & Advisor (T2) | Finance Head (T3) | Sector / Dept Head (T3/5) | General Secretary (T5) | Core Member (T5) | Training Assoc. (T6) | Chief Advisor (T4) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard Home** (`/dashboard/home`) | **Full** | **Full** | View All | View All | View All | View All | Own Only | View Only |
| **Events Management** (`/dashboard/events`) | **Full** | **Approve** | View All | Create | Create | Create (Req Sign-off) | Own Only | View Only |
| **Event Passes & Scanner** (`/dashboard/event-passes`) | **Full** | **Full** | View All | **Full** | **Full** | Issue / Scan | Scan Kiosk | View Only |
| **Tasks & Gantt** (`/dashboard/tasks`) | **Full** | **Full** | View All | Assign / Edit | Create | Own / Exec | Execute Task | View Only |
| **Reimbursements (Gate 1)** (`/dashboard/reimbursements`) | **Full** | **Sign-off** | View All | **Approve Gate 1** | Submit Claim | Submit Claim | Submit Claim | View Only |
| **Reimbursements (Gate 2)** (`/dashboard/reimbursements`) | **Full** | **Audit** | **Verify Gate 2** | — | — | — | — | View Only |
| **Reimbursements (Gate 3)** (`/dashboard/reimbursements`) | **Full** | **Settle Gate 3** | — | — | — | — | — | View Only |
| **Budgeting & Funds** (`/dashboard/budget`) | **Full** | **Full Allocation** | **Manage Funds** | View All | View All | — | — | View Only |
| **Design Portal & OCR** (`/dashboard/designs`) | **Full** | **Full** | View All | Approve Proof | Upload | Upload / Proof | Upload | View Only |
| **Dynamic Form Builder** (`/dashboard/forms`) | **Full** | **Approve Live** | **Approve Live** | Build (Req Sign) | Build Form | Build Form | — | View Only |
| **Event Reports** (`/dashboard/event-reports`) | **Full** | **Approve Report** | View All | View All | **Submit Report** | — | — | View Only |
| **Members Directory** (`/dashboard/directory`) | **Add / Terminate** | **Add Member** | View Roster | View Roster | View Roster | View Roster | Own Profile | View Only |
| **Group Policies** (`/dashboard/policies`) | **Full** | **Full** | — | — | — | — | — | — |
| **Backup & Restore** (`/dashboard/backup`) | **Full** | — | — | — | — | — | — | — |
| **System Settings** (`/dashboard/settings`) | **Full** | — | — | — | — | — | — | — |

> **Access Legend:**
> - **Full**: Unrestricted administrative governance, capability grants, deletions, and overrides.
> - **Approve**: Authority to approve or reject submissions in this module.
> - **Create**: Can author records (routes through sign-off where indicated).
> - **View All / View Only**: Read-only institutional transparency without mutation affordances.
> - **Own Only**: Restricted strictly to personal assigned deliverables, profile, or submitted claims.
> - **—**: Feature access hidden or disabled by RBAC governance.

### 2.3 Super User Quick Switch (Persona Switcher)
Administrators (Tier 1) can evaluate user experience or verify permission rules without logging in and out:
1. In the top bar, open the **Persona Switcher** dropdown.
2. Select any registered member in the system.
3. The dashboard re-renders instantly with that exact user's permissions, navigation sidebar, and data visibility.
4. An amber notification banner remains pinned at the top: **"Impersonating [Name] — Return to Super User"**.
5. Click **Return to Super User** at any time to restore root administrative credentials.

---

## 3. Module-by-Module Operating Instructions

### 3.1 Home Dashboard
The executive landing page upon signing in:
- **KPI Stat Cards**: Real-time totals for Active Events, Pending Tasks, Completed Tasks, and Total Budget vs. Expenditure.
- **Action Required Inbox**: Highlights items waiting on your approval (reimbursements to verify, tasks requiring sign-off).
- **Upcoming Deadlines**: Prioritized timeline of imminent event and task deadlines.
- **Recent Activity Feed**: Audit trail of recent member logins, status updates, and document exports.

![Live Dashboard Screenshot](screenshots/02_dashboard_home.png)
*Figure 3.1: Live Home Dashboard with active metric cards and project timeline.*

---

### 3.2 Events Management
Events are the central operational unit in LEADS ERP.

#### Creating an Event:
1. Navigate to **Events** from the sidebar.
2. Click **+ Create Event**.
3. Fill in the event details:
   - **Title**, **Event Code** (e.g., `TECHFEST-2026`).
   - **Date & Time Range**, **Venue / Campus** (Ramaiah Technology Campus or Gnanagangothri).
   - **Estimated Budget** & **Target Attendance**.
4. Attach **Sub-Committees**:
   - Add specialized committees: Stage Management, Logistics, Hospitality, Social Media, Registration.
   - Assign a **Lead Member** and assign committee members.
5. Click **Submit Proposal**.
6. The event enters **Proposal / Pending Approval** status until approved by a Tier 2/3 Faculty Head.

#### Managing Active Events:
- **Status Progression**: `Draft` → `Pending Approval` → `Approved / Active` → `Completed` → `Archived`.
- From the event detail modal, organizers can trigger linked tasks, monitor pass distribution, generate event reports, and view financial balance sheets.

![Live Events Management Screenshot](screenshots/03_events_management.png)
*Figure 3.2: Live Events Management directory.*

---

### 3.3 Event Passes & Live Scanner Kiosk
The Event Passes module provides a digital ticketing and attendance management suite.

#### Designing & Generating Passes:
1. Open **Event Passes** from the sidebar.
2. Select the target event.
3. Click **+ Issue Pass** (or **Bulk Generate Passes**).
4. Configure attendee information:
   - Attendee Name, Email, Organization/College, Pass Category (VIP, Speaker, Delegate, General Attendee).
5. The system generates a cryptographically unique serial number (e.g., `LEADS-EVT-2026-0812`) and embedded QR/Barcode payload.
6. Click **Send Pass by Email** to dispatch the pass directly to the attendee's inbox with attached pass images and wallet links.

#### Live Scanner Kiosk:
1. On event day, gate volunteers open **Event Passes → Check-in Scanner**.
2. Grant camera permissions on a laptop, tablet, or smartphone.
3. Point the camera at the attendee's QR pass (printed or on phone).
4. **Immediate Feedback**:
   - 🟢 **Green Screen & Chime**: Valid pass. Displays attendee name, category, and timestamps check-in.
   - 🔴 **Red Screen & Buzzer**: Already checked in (prevents pass sharing) or invalid serial.
5. Manual serial entry is supported in low-light conditions.

![Live Event Passes & Scanner Screenshot](screenshots/04_event_passes.png)
*Figure 3.3: Live On-the-Spot Pass Studio and 3D luxury credential interface.*

---

### 3.4 Apple Wallet & Google Wallet Integration
Attendees and committee members can store passes directly inside their phone's native digital wallet.

- **Apple Wallet (`.pkpass`)**:
  - Attendee taps **Add to Apple Wallet** from their email or pass confirmation page.
  - The iOS PassKit engine opens the pass with custom event branding, seat/tier information, and live gate updates.
  - Automatically surfaces on the iPhone lock screen via geo-fencing when near the MSRUAS campus on event day.
- **Google Wallet**:
  - Android users tap **Save to Google Wallet**.
  - Adds the pass to Google Wallet app with barcode, event schedule, and push notification support.

---

### 3.5 Task Management, Delegation & Gantt Timeline
The Tasks module coordinates team deliverables across all operational tiers.

#### Creating and Assigning a Task:
1. Navigate to **Tasks**.
2. Click **+ New Task**.
3. Set the **Task Title**, **Description**, and **Priority** (`High`, `Medium`, `Low`).
4. Select **Assignee Type**:
   - **Individual**: Assign to a specific student or faculty member.
   - **Committee**: Assign to an entire sub-committee (e.g., "Stage Committee" on "TechFest").
5. Pick the **Deadline** date and time.
6. Optional: Upload reference attachments or specifications.
7. Click **Create Task**.

#### Workflow & Gantt View:
- **Status Flow**: `Pending` → `In Progress` → `Review Requested` → `Completed`.
- **Gantt Chart**: Switch to the **Timeline** tab to visualize overlapping task dependencies, milestones, and critical paths across upcoming weeks.
- **Automated Reminders**: The system automatically dispatches email reminders 24 hours and 2 hours before a task deadline.

![Live Task Management Screenshot](screenshots/05_tasks_gantt.png)
*Figure 3.4: Live Task Management interface with workflow categorization and deadlines.*

---

### 3.6 Performance Ratings & Committee Evaluation
Objective performance reviews conducted after event completions:
1. Navigate to **Ratings**.
2. Select an event and target committee or member.
3. Score across standard institutional criteria (1 to 5 stars):
   - Timeliness & Reliability
   - Quality of Deliverables
   - Communication & Teamwork
   - Initiative & Problem Solving
4. Add qualitative commendations or constructive feedback.
5. Ratings automatically aggregate into the student's operational transcript and departmental performance index.

![Live Performance Ratings Screenshot](screenshots/06_performance_ratings.png)
*Figure 3.5: Committee member evaluations and leaderboards.*

---

### 3.7 Procurement & Equipment Requisitions
Designed for sourcing hardware, printing, staging equipment, and external services:
1. Open **Procurement**.
2. Click **+ New Request**.
3. Specify Item Name, Quantity, Estimated Cost, Justification, and Linked Event.
4. Upload vendor quotation PDFs or bill estimates.
5. **Approval Chain**:
   - Requests below departmental limits: Approved by Tier 3 Department Head.
   - High-value procurement: Routed to Tier 2 Centre Head for final clearance.
6. Once purchased, vendor receipt is uploaded to transition the request to `Fulfilled`.

![Live Procurement Requisitions Screenshot](screenshots/07_procurement.png)
*Figure 3.6: Equipment procurement requisitions and tracking.*

---

### 3.8 Financial Reimbursements & Multi-Gate Audit
Ensures student organizers and faculty are reimbursed accurately for approved out-of-pocket expenses.

#### Submitting a Claim:
1. Navigate to **Reimbursements**.
2. Click **+ Submit Claim**.
3. Enter Expense Title, Amount (INR), Date of Expense, Category (Travel, Food, Supplies, Printing).
4. Link to the relevant **Event**.
5. Upload clear photos or PDF scans of payment receipts.
6. Click **Submit**.

#### Multi-Gate Verification Sequence:
```
[Member Submits Claim]
         │
         ▼
[Gate 1: Tier 3 Faculty Head Audit] ────► Rejected (Returned with feedback)
         │ Approved
         ▼
[Gate 2: Tier 2 Centre Head Clearance] ──► Rejected
         │ Approved
         ▼
[Status: Disbursed / Paid]
(Automatically adjusts Event Budget balance and logs transaction)
```

![Live Financial Reimbursements Screenshot](screenshots/08_reimbursements.png)
*Figure 3.7: Live expense claim submission screen with bank settlement coordinates.*

---

### 3.9 Budgeting, P&L & Income Sources
Comprehensive financial balance sheet for the centre:
- **Budget Allocations**: View approved university allocations per semester and event.
- **Income Sources**: Track external sponsorships, ticket revenues, and institutional grants with received vs. pending status.
- **Variance Tracking**: Automatic calculation of Budget vs. Actual Expenditure to prevent cost overruns.
- **Exporting**: Download full fiscal P&L balance sheets to Excel/CSV or formatted PDF.

![Live Budgeting & Funds Screenshot](screenshots/09_budgeting_funds.png)
*Figure 3.8: Financial allocation ledger and variance tracking.*

---

### 3.10 Design Portal, Proofreading & OCR Spellcheck
Manages all promotional posters, banners, and digital creatives before public distribution:
1. Navigate to **Designs**.
2. Upload the graphic asset (PNG, JPG, WebP).
3. Tag with Linked Event, Dimensions (Instagram Post, Banner, A3 Poster), and Target Date.
4. **Automated AI OCR Spellcheck**:
   - The built-in Tesseract.js engine scans the graphic for embedded text.
   - Cross-references dates, guest names, and institutional spelling against English dictionaries (`nspell`).
   - Flags typos or mismatched event dates automatically.
5. **Faculty Sign-Off**: Designated Media Faculty approves the creative. Once approved, watermark status updates to `Ready for Publishing`.

![Live Design Portal & OCR Screenshot](screenshots/10_design_portal.png)
*Figure 3.9: Design proofreading gallery and creative approvals.*

---

### 3.11 Dynamic Form Builder & Public Submissions
Create custom online registration, RSVP, and feedback surveys without external tools like Google Forms.

#### Creating a Form:
1. Navigate to **Forms**.
2. Click **+ Create Form**.
3. Customize form title, description, and custom public URL slug (e.g., `/forms/workshop-rsvp`).
4. Add fields: Text, Email, Phone, Dropdown, Checkbox group, Rating stars, File upload.
5. Set optional response limits and close dates.
6. Save and publish.

#### Sharing & Collecting:
- The system generates a public URL and downloadable high-resolution **QR Code**.
- Submissions are captured in real time.
- View responses in structured data tables or click **Export to Word (.docx)** / **Export to CSV**.

![Live Dynamic Form Builder Screenshot](screenshots/11_dynamic_forms.png)
*Figure 3.10: Form designer canvas and custom field generator.*

---

### 3.12 Digital Visiting Cards & 3D Interactive Keycard
Every verified member receives a personalized digital visiting card:
- Accessible at `https://leads.msruas.ac.in/card/[slug]`.
- **Interactive 3D Keycard**: WebGL-powered 3D badge that responds to touch, mouse movement, and device gyroscopes.
- **vCard Download**: Instant "Save Contact" button adding name, designation, phone, email, and social links to the smartphone address book.
- **Wallet Pass**: Downloadable Digital Visiting Card pass for Apple and Google Wallet.

![Live Digital Visiting Card Screenshot](screenshots/12_visiting_card.png)
*Figure 3.11: 3D interactive keycard and public credential profile.*

---

### 3.13 Guest Directory & VIP Invitation Engine
Maintains institutional relationships with visiting dignitaries, keynote speakers, and industry partners:
- **Adding Guests**: Enter contact details or photograph their physical visiting card—the built-in OCR scans the card and auto-populates Name, Company, Designation, and Phone.
- **Personalized Invites**: Select multiple guests and click **Send Formal Invitation** to dispatch personalized invitation emails with embedded RSVP buttons.

![Live Guest Directory Screenshot](screenshots/13_guest_directory.png)
*Figure 3.12: Dignitary and VIP guest roster.*

---

### 3.14 Announcements & Scoped Broadcasts
Broadcast urgent notices, circulars, and updates:
- **Scoping**:
  - `All Members`: Sent to all faculty and student accounts.
  - `Core Committee Only`: Confidential operational notices.
  - `Faculty Only`: Academic and administrative memos.
- Pinned announcements appear prominently on the Home Dashboard and trigger automated email dispatches.

![Live Announcements Screenshot](screenshots/15_announcements.png)
*Figure 3.13: Scoped announcement composer and broadcast log.*

---

### 3.15 Master Calendar & Festival Schedule
Unified schedule view:
- Displays all upcoming events, rehearsal dates, task milestones, and university academic holidays.
- Filter by campus (Ramaiah Tech Campus vs. Gnanagangothri).
- Export to iCal format to sync with Google Calendar or Apple Calendar.

![Live Master Calendar Screenshot](screenshots/16_master_calendar.png)
*Figure 3.14: Master schedule with festival dates and conflict detection.*

---

### 3.16 Executive Event Reports & PDF/Word Exports
After an event concludes, generate professional post-event documentation:
1. Navigate to **Event Reports**.
2. Select the completed event.
3. System aggregates:
   - Executive Summary & Objectives.
   - Attendance statistics and gate check-in graphs.
   - Final Budget vs. Actual Financial Statement.
   - Committee member contributions and ratings.
   - Uploaded event photo gallery.
4. Click **Download Executive Report (PDF)** or **Export Report (Word .docx)** for formal submission to university leadership.

![Live Executive Event Reports Screenshot](screenshots/18_event_reports.png)
*Figure 3.15: Post-event report generation and export tools.*

---

### 3.17 Unified Approvals Inbox
A centralized hub for Tier 2 and Tier 3 decision-makers:
- Collates pending **Event Proposals**, **Procurement Requests**, **Reimbursement Claims**, and **Design Assets** in one list.
- Enables one-click inline approval or rejection with mandatory feedback notes.
- Eliminates administrative bottlenecks across disparate modules.

![Live Unified Approvals Screenshot](screenshots/20_approvals_inbox.png)
*Figure 3.16: Centralized approval inbox for all institutional sign-offs.*

---

### 3.18 Members Directory & Account Provisioning
Manage institutional members, leadership transitions, and user access:
- **Add Member**: Super User or Head enters Name, Email, Division, Role, and Phone. System generates activation link.
- **Role Assignment**: Change roles (e.g. promoting a Training Associate to Core Committee Lead).
- **Require Password Reset**: Forces the user to change credentials upon next login.
- **Deactivate / Offboard**: Suspends account immediately, terminating all active login sessions.

![Live Members Directory Screenshot](screenshots/21_members_directory.png)
*Figure 3.17: Member management roster and RBAC governance.*

---

### 3.19 Custom Group Policies & Access Thresholds
Provides fine-grained security customization without code changes:
- Create custom policies granting specific members access to restricted modules (e.g., granting a student treasurer access to Budgeting).
- Configure Tier access thresholds across modules.

![Live Custom Group Policies Screenshot](screenshots/22_group_policies.png)
*Figure 3.18: Granular capability overrides and access control policies.*

---

### 3.20 Email Delivery Engine & SMTP Mailroom Portal
The **Mailroom Audit Portal** (`/dashboard/email`) provides institutional email relay controls, automated system dispatches (account activation tokens, OTPs, task notifications, pass deliveries, birthday greetings), scoped announcements, and delivery audit logs.

> **Access Permission:** Restricted strictly to **Tier 1 (Super User)** and **Tier 2 (Centre Head)**.

![Live Email Engine Screenshot](screenshots/23_email_management.png)
*Figure 3.19: Outbound SMTP transmission queue and delivery logs.*

---

#### Step 1: Navigating to SMTP Mail Relay Configuration
1. In the sidebar, select **Email Engine** (`/dashboard/email`).
2. Click the **SMTP Configuration** tab in the top navigation toggle.
3. The configuration panel displays the provider selection matrix and credential input forms.

---

#### Step 2: Selecting Mail Relay Provider
Select the service provider matching your institution's email infrastructure:

| Provider Card | Default Endpoint | Security / Authentication Requirements |
|---|---|---|
| **Gmail / Workspace** | `smtp.gmail.com:587` | Requires Google Workspace account with 2-Factor Authentication enabled and a 16-character **Google App Password**. |
| **Outlook 365** | `smtp.office365.com:587` | Requires Microsoft 365 mailbox with **SMTP AUTH enabled** in M365 Admin Center (`Users → Active Users → [Mailbox] → Mail → Manage email apps → check Authenticated SMTP`). |
| **Custom SMTP** | User-defined | Any on-premise institutional SMTP relay (e.g. `mail.institution.edu`) supporting STARTTLS or SSL. |
| **Local Postfix** | `localhost:25` | Zero-credential local relay daemon running directly on the Linux VPS. |
| **Direct Send (Built-in)** | MX Direct (Port 25) | Built-in direct dispatch. The ERP resolves recipient domain MX records via DNS and connects directly without intermediary relays. Requires configured reverse-DNS (PTR). |

---

#### Step 3: Input Field Reference ("What to Enter and Where")

##### A. Standard SMTP Relays (Gmail, Outlook, Custom SMTP, Postfix)
- **SMTP Host \***:
  - *Where to enter:* First input in the server parameters grid.
  - *What to enter:* The fully qualified hostname of your outgoing mail server (e.g. `smtp.gmail.com`, `smtp.office365.com`, or `mail.institution.edu`).
- **SMTP Port \***:
  - *Where to enter:* Second input in the server parameters grid.
  - *What to enter:* `587` for STARTTLS (recommended), `465` for TLS/SSL wrapper, or `25` for local unauthenticated Postfix.
- **Auth Username / Email**:
  - *Where to enter:* Under "Auth Username / Email".
  - *What to enter:* The institutional service account address (e.g. `<system-notifications@institution.edu>`). Leave empty if using local unauthenticated Postfix.
- **App Password / Auth Secret**:
  - *Where to enter:* Under "App Password / Auth Secret". Click the eye icon to toggle visibility.
  - *What to enter:* The 16-character application-specific password. Never enter your personal account password.
- **Sender Display Name \***:
  - *Where to enter:* Under "Sender Display Name".
  - *What to enter:* The formal institutional sender name appearing in recipients' inboxes (e.g. `LEADS Next Gen Centre`).
- **Sender Email Address \***:
  - *Where to enter:* Under "Sender Email Address".
  - *What to enter:* The RFC 5322 "From" address (e.g. `<notifications@institution.edu>`). Must match the authenticated mailbox domain to pass SPF/DMARC checks.

##### B. Built-in Direct Send Mode (No Relay)
When **Direct Send (Built-in)** is selected:
- **HELO Hostname \***:
  - *Where to enter:* Direct Send parameters box.
  - *What to enter:* The fully qualified domain name (FQDN) assigned to your VPS outbound IP (e.g. `mail.institution.edu`).
  - *Requirement:* Must match the PTR (reverse-DNS) record on your VPS IP address; receiving mail servers (Gmail, Microsoft) reject connections without valid reverse DNS.

##### C. Advanced DKIM Cryptographic Signing (Optional)
Click **DKIM Signing (Advanced)** to expand the cryptographic key fields:
- **DKIM Domain**: The domain signing the outbound messages (e.g. `institution.edu`).
- **DKIM Selector**: The DNS selector prefix (e.g. `leads`), matching the public DNS TXT record at `<selector>._domainkey.<domain>`.
- **DKIM Private Key**: Paste the PEM-formatted RSA private key (`-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----`).

---

#### Step 4: Saving Credentials & Encryption At Rest
1. Review all entered fields for accuracy.
2. Click **Save SMTP Credentials**.
3. **What Happens:**
   - Field validations trigger. If any mandatory field is missing, the form scrolls automatically to the invalid field with an alert toast.
   - The server encrypts sensitive credentials using the master `DATA_ENCRYPTION_KEY` and persists them in `leads-dashboard/data/systemSettings.json`.
   - A green toast appears: *"Email server credentials and SMTP settings updated successfully."*
   - The "Last updated" timestamp refreshes.

---

#### Step 5: Connection Diagnostics & Sending a Test Email
1. In the right-hand panel under **Connection Diagnostics & Test**, locate the **Test Recipient Email** box.
2. Enter a verified destination inbox (e.g. `<admin-test@institution.edu>`).
3. Click **Test Connection & Send Email**.
4. **Diagnostic Execution Flow:**
   - The button switches to a spinning status: *"Verifying SMTP Server..."*
   - The server establishes a socket connection to the configured host and port.
   - Negotiates TLS handshake and submits authentication credentials.
   - Sends a formatted HTML diagnostic message.
5. **Evaluating Test Results:**
   - **Success (Green Box):** Displays **"SMTP Handshake Verified"** along with the server response code (e.g. `250 2.0.0 OK: message queued`). Check the test inbox to confirm email delivery.
   - **Failure (Red Box):** Displays **"SMTP Handshake Error"** with raw diagnostic details:
     - `535 5.7.8 Authentication credentials invalid`: Check username and verify the App Password.
     - `ETIMEDOUT` / `ECONNREFUSED`: Firewall or ISP blocking port 587/465.
     - `535 5.7.139 Authentication unsuccessful (M365)`: SMTP AUTH is disabled on the Microsoft 365 mailbox; an administrator must enable it in the Microsoft 365 Admin Center.

---

#### Step 6: Composing & Dispatching Broadcast Emails
1. Click the **Compose Broadcast** tab.
2. Select the **Target Audience Scope**:
   - `All Members`: Entire university roster.
   - `Faculty / Dept Heads`: Tier 2 through 4 faculty leadership.
   - `Core Committee`: Tier 5 student organizers.
   - `Training Associates`: Tier 6 general student workforce.
   - `Custom List`: Enter comma-separated recipient addresses.
3. Enter the **Email Subject Line** and compose message body in Markdown or Rich Text.
4. Attach optional files (enforces max 25MB total attachment limit per SMTP standards).
5. Click **Dispatch Broadcast**. A security confirmation modal displays the recipient count and target scope. Confirm to initiate delivery.

---

#### Step 7: Sent Outbox History & Delivery Audit Logs
1. Click the **Sent Outbox & Audit Logs** tab.
2. Inspect the real-time operational metrics:
   - **Total Sent Emails**: Cumulative dispatches since system initialization.
   - **Successful Handshakes**: Messages accepted by receiving mail transfer agents (MTAs).
   - **Failed Dispatches**: Messages rejected, bounced, or timed out.
3. The live log table shows:
   - **Timestamp**: Exact delivery attempt date and time.
   - **Recipient & Category**: Member email and dispatch type (`Activation Token`, `Pass Delivery`, `Task Digest`, `Announcement`).
   - **Status Badge**: `DELIVERED` (Green), `QUEUED` (Amber), or `BOUNCED` (Red).
   - **Action**: Click **Inspect Diagnostics** to view the full SMTP handshake transcript and error codes.

---

### 3.21 System & Security Settings
Administrative configuration panel:
- **Branding**: Update centre logo, institutional title, and portal contact info.
- **SMTP Gateway**: Configure primary email relay (Google Workspace, Microsoft 365, or Local Direct Postfix).
- **Wallet Pass Certificates**: Manage Apple PassKit signing certificates and Google Wallet service account credentials.

![Live System Settings Screenshot](screenshots/25_system_settings.png)
*Figure 3.20: System security settings and encryption controls.*

---

### 3.22 Encrypted Backup & Restore
Guarantees institutional data sovereignty and disaster recovery:
1. Super User navigates to **Backup**.
2. Click **Create Encrypted Snapshot**.
3. Downloads a full JSON archive encrypted under AES-256-GCM.
4. Backups can be restored in the UI or decrypted offline using `node scripts/decrypt-backup.js`.

![Live Encrypted Backup Screenshot](screenshots/24_backup_restore.png)
*Figure 3.21: Encrypted backup and point-in-time disaster recovery.*

---

## 4. Step-by-Step Operator Playbooks by Designation

This section details the exact step-by-step procedures for each institutional role, including the primary action buttons, what happens on each click, and actual live application screenshots.

---

### 4.1 Playbook: Tier 1 — Super User Administration
*Applicable Designation:* **Super User / System Administrator**

#### Step 1: Real-Time Role Impersonation via Persona Switcher
1. Navigate to **Home Dashboard** (`/dashboard/home`).
2. Click the **Account Switcher** (UserCog icon) in the header navigation bar.
3. Select any registered member from the searchable dropdown roster.
4. **What Happens:** The entire client interface re-renders under that target user's exact tier, department, and permissions. An amber notification banner pins to the header: *"Impersonating [Name] — Return to Super User"*.
5. Click **Return to Super User** at any time to restore root administrative credentials.

![Super User Persona Switcher](screenshots/steps/01_super_user/02_persona_switcher_active.png)
*Figure 4.1.1: Live captured Super User quick-switch dropdown menu.*

#### Step 2: Member Account Provisioning & Password Override
1. Navigate to **Members Directory** (`/dashboard/directory`).
2. Click **+ Add Member**.
3. Fill in Name, Institutional Email, select Division (*Faculty*, *Core Committee*, *Training Associate*, or *Alumni*), and assign Department and Position.
4. Click **Add Member**.
5. **What Happens:** The system creates the member record, generates a single-use activation token (`act-...`), and dispatches an onboarding email. Alternatively, the Super User can click **Set Password Directly** to establish credentials immediately without OTP.

![Member Provisioning Modal](screenshots/steps/01_super_user/04_add_member_modal.png)
*Figure 4.1.2: Live captured member provisioning modal.*

#### Step 3: Granular Access Control & Group Policies
1. Navigate to **Group Policies** (`/dashboard/policies`).
2. Review the built-in access levels or click **+ Create Policy**.
3. Toggle module view/edit grants and capability tags (e.g., `PROPOSE_BUDGET`, `MANAGE_EVENT_PASSES`).
4. Click **Save Policies**.
5. **What Happens:** Target members inherit the capability tag immediately with reactive cross-device sync.

![Group Policies Builder](screenshots/steps/01_super_user/05_group_policies_matrix.png)
*Figure 4.1.3: Live captured group policies capability editor.*

#### Step 4: Encrypted AES-256 Disaster Recovery Snapshot
1. Navigate to **Backup & Restore** (`/dashboard/backup`).
2. Click **Create Encrypted Backup Now**.
3. **What Happens:** The server dumps all collections (JSON and SQLite), compresses the payload, encrypts it under AES-256-GCM using `DATA_ENCRYPTION_KEY`, and downloads a `.leads.enc` archive.
4. To recover from a catastrophe, drag the snapshot into the **Restore Dropzone**, input the decryption passphrase, and click **Execute Restoration**.

![Encrypted Backup Portal](screenshots/steps/01_super_user/06_encrypted_backup_portal.png)
*Figure 4.1.4: Live captured AES-256 encrypted backup and point-in-time recovery screen.*

---

### 4.2 Playbook: Tier 2 — Centre Head & Faculty Advisor
*Applicable Designations:* **Centre Head**, **Faculty Advisor**, and **Head of Events (GG Campus - Tier 2.5)**

#### Step 1: Manage Unified Approvals Inbox
1. Navigate to **Approvals Inbox** (`/dashboard/approvals`).
2. Filter by category (*Events*, *Tasks*, *Reimbursements*, *Budgets*, *Forms*).
3. Inspect pending proposal details.
4. Click **Approve (Checkmark)** to grant authorization, or click **Reject (Cross)** and supply audit feedback notes.
5. **What Happens:** The item updates instantly across all active client devices within 7 seconds.

![Approvals Inbox Queue](screenshots/steps/02_centre_head/01_approvals_inbox_queue.png)
*Figure 4.2.1: Live captured unified approvals inbox queue.*

#### Step 2: Executive Event Proposal Sanction
1. Navigate to **Events** (`/dashboard/events`).
2. Filter by `Pending Approval` to isolate new proposals.
3. Review proposed budget ceiling, venue selection, target delegate attendance, and committee assignments.
4. Click **Approve Proposal**.
5. **What Happens:** Event transitions to `Active` on the university calendar, unlocking pass issuance and dynamic form generation.

![Events Executive View](screenshots/steps/02_centre_head/02_events_executive_view.png)
*Figure 4.2.2: Live captured events management dashboard with proposal sanction controls.*

#### Step 3: Gate-3 Financial Reimbursement Final Settlement
1. Navigate to **Reimbursements** (`/dashboard/reimbursements`).
2. Filter for claims with status `Verified by Finance Head (Gate 2 Passed)`.
3. Inspect claimant's bank account number, IFSC code, and attached GST invoice vouchers.
4. Click **Disburse / Settle Gate 3**.
5. **What Happens:** Claim badge turns green (`Settled`), payment timestamp is stamped into the immutable audit ledger, and the event's actual expenditure figure updates automatically.

![Gate 3 Settlement](screenshots/steps/02_centre_head/03_reimbursements_gate3_settlement.png)
*Figure 4.2.3: Live captured Gate-3 financial reimbursement settlement portal.*

---

### 4.3 Playbook: Tier 3 — Department Heads & Finance Head
*Applicable Designations:* **Head of Finance**, **Head of Events (RTC Campus)**, **Sector & Department Heads**

#### Step 1: Gate-2 Financial & GST Treasury Audit (Head of Finance)
1. Open **Reimbursements** (`/dashboard/reimbursements`). Note: Claims only appear on the Finance Head's board after Gate-1 approval by the Sector Head!
2. Click on the claim row to expand receipt previews and vendor tax details.
3. Verify that invoice items match institutional guidelines.
4. Click **Verify Gate 2**.
5. **What Happens:** Claim advances to Gate 3 for Centre Head final disbursement.

![Gate 2 Financial Audit](screenshots/steps/03_dept_heads/01_reimbursements_gate2_audit.png)
*Figure 4.3.1: Live captured Gate-2 financial audit portal.*

#### Step 2: Assign Department Task Deliverables (Department Heads)
1. Navigate to **Tasks** (`/dashboard/tasks`).
2. Click **+ New Task**.
3. Select Target Event, Assignee from your department, Priority (*Low*, *Medium*, *High*, *Urgent*), Deadline, and add subtask checklist items.
4. Click **Assign Task**.
5. **What Happens:** An automated assignment notification is dispatched to the student associate, and the task card appears in their personal workspace.

![Task Creation Modal](screenshots/steps/03_dept_heads/03_new_task_modal.png)
*Figure 4.3.2: Live captured task assignment modal with checklist criteria.*

#### Step 3: Supervise Milestones in Gantt Timeline View
1. On the **Tasks** page, click **Timeline / Gantt View**.
2. **What Happens:** Layout switches from cards to a chronological schedule grid displaying milestones, deadlines, and dependencies.

![Gantt Timeline View](screenshots/steps/03_dept_heads/04_tasks_gantt_timeline.png)
*Figure 4.3.3: Live captured Gantt timeline schedule.*

---

### 4.4 Playbook: Tier 5 — Core Committee & Secretariat
*Applicable Designations:* **President**, **Vice President**, **General Secretary**, **Chief Coordinator**, **Core Committee Members**

#### Step 1: Draft Event Proposal in Event Studio
1. Navigate to **Events** (`/dashboard/events`) and click **+ Create Event**.
2. Input Title, Dates, Venue, Budget Estimate, and Target Attendance.
3. Assign Committee Leads for Logistics, Hospitality, Social Media, and Stage Management.
4. Click **Submit Proposal**.
5. **What Happens:** Event proposal routes to Centre Head/Advisor queue in `Pending Approval` status.

![Create Event Studio](screenshots/steps/04_core_committee/01_create_event_studio_modal.png)
*Figure 4.4.1: Live captured Event Studio modal.*

#### Step 2: Configure & Issue Passes in Pass Studio
1. Navigate to **Event Passes** (`/dashboard/event-passes`).
2. Click **+ Generate Pass** (or select **Pass Studio**).
3. Select pass category (*VIP Pass*, *Student Delegate*, *Speaker*, *Organizer*).
4. Enter attendee details and click **Issue Pass**.
5. **What Happens:** System generates a signed digital pass with high-entropy QR serial number and delivers it via email with Apple/Google Wallet links.

![Pass Studio Workspace](screenshots/steps/04_core_committee/02_pass_studio_workspace.png)
*Figure 4.4.2: Live captured Event Pass Studio.*

#### Step 3: Operate Gate Turnstile Scanner Kiosk
1. Navigate to **Event Passes** (`/dashboard/event-passes`).
2. Click **Launch Turnstile Scanner**.
3. Allow camera access. Align attendee's QR pass inside the scanning reticle.
4. **What Happens:** Audio chime sounds. Green banner displays attendee name, category, and photo (*"Admitted"*). If already scanned, a red warning displays (*"Already Checked In at [Time]"*).

![Turnstile Scanner Kiosk](screenshots/steps/04_core_committee/03_turnstile_scanner_viewfinder.png)
*Figure 4.4.3: Live captured Turnstile Scanner viewfinder kiosk.*

#### Step 4: Build Public Registration Forms
1. Navigate to **Forms** (`/dashboard/forms`).
2. Click **+ Create New Form**.
3. Drag and drop form fields (*Text Input*, *Dropdown*, *Multiple Choice*, *File Upload*).
4. Click **Publish Form**.
5. **What Happens:** Activates public link (`/forms/[slug]`) and generates QR code for promotional posters.

![Dynamic Form Builder](screenshots/steps/04_core_committee/04_dynamic_form_builder.png)
*Figure 4.4.4: Live captured Dynamic Form Builder canvas.*

#### Step 5: Submit Official Post-Event Report (General Secretary)
1. Navigate to **Event Reports** (`/dashboard/event-reports`).
2. Click **+ Submit Event Report**.
3. Select completed event; enter Final Delegate Turnout, Actual Budget Spent, Upload Event Photographs, and Key Recommendations.
4. Click **Submit for Review**.
5. **What Happens:** Locks report and sends notification to Centre Head for formal institutional archiving and PDF/DOCX compilation.

![Event Report Portal](screenshots/steps/04_core_committee/05_general_secretary_event_report.png)
*Figure 4.4.5: Live captured General Secretary event reporting interface.*

---

### 4.5 Playbook: Tier 6 — Training Associates & Student Members
*Applicable Designations:* **Training Associates**, **Student Volunteers**, **Committee Interns**

#### Step 1: Acknowledge & Execute Assigned Tasks
1. Navigate to **Tasks** (`/dashboard/tasks`) and view **My Tasks**.
2. Click **Acknowledge Task** to confirm receipt.
3. Update status dropdown from `Assigned` to `In Progress`.
4. Check off individual subtask items as you finish them.
5. Upload deliverable files and select **Mark Completed**.

![Student Task Checklist](screenshots/steps/05_training_associate/01_student_task_checklist.png)
*Figure 4.5.1: Live captured student task card with acknowledgement and subtask checklist.*

#### Step 2: File Expense Reimbursement Claim
1. Navigate to **Reimbursements** (`/dashboard/reimbursements`).
2. Under **Submit Claim Form**:
   - Select linked Event and Task.
   - Enter Category (e.g. *Printing & Stationary*, *Hardware*), Amount (₹), and Description.
   - Provide Bank Name, Account Number, IFSC Code, and UPI ID.
   - Drag and drop invoice receipts into the **Receipt File Dropzone**.
3. Click **Submit Reimbursement Claim**.
4. **What Happens:** Claim enters `Pending Gate-1 Approval` and notifies your Department Head.

![Claim Submission Form](screenshots/steps/05_training_associate/02_claim_submission_form.png)
*Figure 4.5.2: Live captured reimbursement claim submission form.*

#### Step 3: Manage 3D Digital Keycard Profile
1. Navigate to **Visiting Card** (`/dashboard/visiting-card`).
2. Click **Edit Card Information** to configure Bio, Phone, and LinkedIn.
3. Drag with your mouse or finger to spin the 3D WebGL holographic keycard.
4. Click **Download vCard (.vcf)** or display QR code for contactless contact sharing.

![Digital Keycard Profile](screenshots/steps/05_training_associate/03_digital_keycard_profile.png)
*Figure 4.5.3: Live captured 3D interactive holographic digital visiting card.*

---

### 4.6 Playbook: Tiers 4 & 7 — Chief Advisor & Alumni
*Applicable Designations:* **Chief Advisor**, **Advisory Board Members**, **Alumni**

- **Chief Advisor (View-Only Mode):** Holds comprehensive read-only transparency across all operational metrics, budgets, and event reports. Action buttons (*Create*, *Edit*, *Approve*, *Delete*) are disabled by architecture.
- **Alumni Members:** Have access to public event archives, alumni networking rosters, and personal digital keycards.

![Chief Advisor View-Only](screenshots/steps/06_chief_advisor/01_chief_advisor_view_only.png)
*Figure 4.6.1: Live captured Chief Advisor consultative view-only mode.*

---

### 4.7 Standard Shared Operating Procedures
The following operational workflows are standardized across all roles:
1. **Reimbursement Claim Submission:** Follows the exact same submission procedure across Training Associates, Core Members, and Faculty.
2. **Turnstile Gate Check-in:** Standardized camera QR scanning interface used by volunteers, security leads, and organizers.
3. **One-Time Token Activation:** Standardized secure password setup procedure for all provisioned institutional accounts.

## 5. Troubleshooting & Frequently Asked Questions

#### Q: I made a change on my laptop, but my colleague doesn't see it on their screen.
> **Answer**: The application automatically syncs with the server every **7 seconds**. If you need an instant sync, click on any sidebar link or press `F5` / `Ctrl+R` to force a browser refresh.

#### Q: My account activation link says "Invalid or Expired Token".
> **Answer**: For security, activation tokens expire after 48 hours or after being used once. Contact your administrator or Department Head to click **Resend Activation Link** from the Members Directory.

#### Q: The check-in QR scanner is having trouble scanning a pass.
> **Answer**: 
> 1. Ensure the camera lens is clean and the attendee's phone screen brightness is at maximum.
> 2. If lighting is dim, tap the **Flashlight** button inside the scanner.
> 3. You can also manually type the serial number (e.g. `LEADS-EVT-2026-XXXX`) in the search box below the camera.

#### Q: The receipt photo won't upload to my reimbursement claim.
> **Answer**: Ensure your image file is in JPG, PNG, or PDF format and does not exceed **10 MB**. If your phone takes very high-resolution photos, take a screenshot of the photo and upload that instead.

#### Q: An attendee's Apple Wallet button is not opening.
> **Answer**: Ensure the attendee is opening the link in **Safari** on an iPhone running iOS 14+. Third-party browsers (Chrome/Firefox for iOS) may require tapping "Open in Safari" to install `.pkpass` files into Apple Wallet.

---

*© 2026 LEADS Next Gen Centre, M.S. Ramaiah University of Applied Sciences. All rights reserved.*
