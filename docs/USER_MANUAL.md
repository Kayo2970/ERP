# LEADS ERP — User Operations & Privileges Manual

> **Version:** 2.0 Production  
> **Platform:** LEADS Next Gen Centre ERP Operations Portal  
> **Institution:** M.S. Ramaiah University of Applied Sciences (MSRUAS)  
> **Target Audience:** Students, Training Associates, Committee Leads, Faculty Advisors, Department Heads, and Super Users.

---

## Table of Contents

1. [Welcome & Getting Started](#1-welcome--getting-started)
   - [Platform Overview](#11-platform-overview)
   - [First-Time Account Activation & Password Setup](#12-first-time-account-activation--password-setup)
   - [Mobile / PWA Installation (iOS & Android)](#13-mobile--pwa-installation-ios--android)
   - [Interface Layout & Navigation Shell](#14-interface-layout--navigation-shell)
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

### 1.2 First-Time Account Activation & Password Setup
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

### 1.3 Mobile / PWA Installation (iOS & Android)
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

### 1.4 Interface Layout & Navigation Shell
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

### 2.2 Role Matrix Summary

```
                       ┌───────────────────────────────┐
                       │      Tier 1: Super User       │ (Full Platform Control)
                       └──────────────┬────────────────┘
                                      │
                       ┌──────────────▼────────────────┐
                       │      Tier 2: Centre Head      │ (Final Budgets, Executive Approvals)
                       └──────────────┬────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│ Tier 3: Department Heads  │                   │  Tier 4: Advisory Board   │
│ (Approvals, Event Leads)  │                   │     (Executive View)      │
└─────────────┬─────────────┘                   └───────────────────────────┘
              │
              ▼
┌───────────────────────────┐
│ Tier 5: Core Committee    │ (Event Setup, Pass Studio, Tasks, Form Builders)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Tier 6: Training Assoc.   │ (Task Execution, Expense Claims, Card Profile)
└───────────────────────────┘
```

---

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

---

### 3.9 Budgeting, P&L & Income Sources
Comprehensive financial balance sheet for the centre:
- **Budget Allocations**: View approved university allocations per semester and event.
- **Income Sources**: Track external sponsorships, ticket revenues, and institutional grants with received vs. pending status.
- **Variance Tracking**: Automatic calculation of Budget vs. Actual Expenditure to prevent cost overruns.
- **Exporting**: Download full fiscal P&L balance sheets to Excel/CSV or formatted PDF.

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

---

### 3.12 Digital Visiting Cards & 3D Interactive Keycard
Every verified member receives a personalized digital visiting card:
- Accessible at `https://leads.msruas.ac.in/card/[slug]`.
- **Interactive 3D Keycard**: WebGL-powered 3D badge that responds to touch, mouse movement, and device gyroscopes.
- **vCard Download**: Instant "Save Contact" button adding name, designation, phone, email, and social links to the smartphone address book.
- **Wallet Pass**: Downloadable Digital Visiting Card pass for Apple and Google Wallet.

---

### 3.13 Guest Directory & VIP Invitation Engine
Maintains institutional relationships with visiting dignitaries, keynote speakers, and industry partners:
- **Adding Guests**: Enter contact details or photograph their physical visiting card—the built-in OCR scans the card and auto-populates Name, Company, Designation, and Phone.
- **Personalized Invites**: Select multiple guests and click **Send Formal Invitation** to dispatch personalized invitation emails with embedded RSVP buttons.

---

### 3.14 Announcements & Scoped Broadcasts
Broadcast urgent notices, circulars, and updates:
- **Scoping**:
  - `All Members`: Sent to all faculty and student accounts.
  - `Core Committee Only`: Confidential operational notices.
  - `Faculty Only`: Academic and administrative memos.
- Pinned announcements appear prominently on the Home Dashboard and trigger automated email dispatches.

---

### 3.15 Master Calendar & Festival Schedule
Unified schedule view:
- Displays all upcoming events, rehearsal dates, task milestones, and university academic holidays.
- Filter by campus (Ramaiah Tech Campus vs. Gnanagangothri).
- Export to iCal format to sync with Google Calendar or Apple Calendar.

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

---

### 3.17 Unified Approvals Inbox
A centralized hub for Tier 2 and Tier 3 decision-makers:
- Collates pending **Event Proposals**, **Procurement Requests**, **Reimbursement Claims**, and **Design Assets** in one list.
- Enables one-click inline approval or rejection with mandatory feedback notes.
- Eliminates administrative bottlenecks across disparate modules.

---

### 3.18 Members Directory & Account Provisioning
Manage institutional members, leadership transitions, and user access:
- **Add Member**: Super User or Head enters Name, Email, Division, Role, and Phone. System generates activation link.
- **Role Assignment**: Change roles (e.g. promoting a Training Associate to Core Committee Lead).
- **Require Password Reset**: Forces the user to change credentials upon next login.
- **Deactivate / Offboard**: Suspends account immediately, terminating all active login sessions.

---

### 3.19 Custom Group Policies & Access Thresholds
Provides fine-grained security customization without code changes:
- Create custom policies granting specific members access to restricted modules (e.g., granting a student treasurer access to Budgeting).
- Configure Tier access thresholds across modules.

---

### 3.20 Email Delivery Engine & Queue Logs
Monitor system-wide communication health:
- View live transmission status of task reminders, birthday greetings, pass deliveries, and broadcasts.
- Filter by Delivered, Bounced, or Queued.
- Send one-off administrative test emails to verify SMTP connectivity.

---

### 3.21 System & Security Settings
Administrative configuration panel:
- **Branding**: Update centre logo, institutional title, and portal contact info.
- **SMTP Gateway**: Configure primary email relay (Google Workspace, Microsoft 365, or Local Direct Postfix).
- **Wallet Pass Certificates**: Manage Apple PassKit signing certificates and Google Wallet service account credentials.

---

### 3.22 Encrypted Backup & Restore
Guarantees institutional data sovereignty and disaster recovery:
1. Super User navigates to **Backup**.
2. Click **Create Encrypted Snapshot**.
3. Downloads a secure `.zip` package containing all database collections and file uploads encrypted with your master key.
4. **Restore**: Upload a previously saved snapshot to restore the system to an exact point in time.

---

## 4. Step-by-Step Workflows by Role

### 4.1 For Students / Training Associates (Tiers 5-6)
- **Starting your day**: Log in and check **Home Dashboard** for assigned tasks.
- **Executing a task**: Click on a task in **Tasks**, update progress notes, attach completed files, and click **Submit for Review**.
- **Claiming an expense**: If you purchased supplies for an event, take a photo of the bill, go to **Reimbursements → + Submit Claim**, enter the amount, and submit.
- **Sharing your contact**: Go to **Visiting Card** to show your QR code to guests or tap **Save Contact** to exchange information.

---

### 4.2 For Event Organizers & Committee Leads (Tiers 3, 5)
- **Organizing an event**: Create the event under **Events**, define sub-committees, and assign student volunteers.
- **Managing event passes**: Open **Event Passes → Studio**, set up delegate passes, and trigger automated email deliveries.
- **Setting up check-in**: On event day, assign gate volunteers to open the **Check-in Scanner** on their phones.
- **Closing the event**: Mark all tasks complete, compile the **Event Report**, and submit performance ratings for your team.

---

### 4.3 For Faculty Advisors & Department Heads (Tiers 2-4)
- **Reviewing Proposals**: Open **Approvals** to review new event proposals and initial budget estimates.
- **Auditing Reimbursements**: Check Gate-1 reimbursement claims, verify uploaded receipt images against claimed amounts, and click **Approve** or **Reject**.
- **Monitoring Analytics**: Use **Reports** and **Ratings** to observe departmental productivity trends.

---

### 4.4 For Centre Head & Executive Leadership (Tier 2)
- **Final Financial Clearance**: Clear high-value procurement requisitions and final Level-2 reimbursement payments.
- **Budgetary Strategy**: Review the master P&L sheet under **Budget** to allocate funds across upcoming academic initiatives.
- **VIP Engagements**: Oversee high-level guest invitations via **Guest Directory**.

---

### 4.5 For System Administrators (Tier 1 Super User)
- **Onboarding New Teams**: Import member rosters, configure roles, and dispatch activation invitations.
- **System Maintenance**: Monitor the **Email Queue**, review audit logs, and schedule weekly **Encrypted Backups**.
- **Security Oversight**: Manage password policies, session revocations, and group policy overrides.

---

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
