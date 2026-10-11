<!-- converted from LEADS_ERP_User_Manual.docx -->

LEADS NEXT GEN CENTRE
OPERATIONS & PRIVILEGES MANUAL
Institutional User Guide, Role Privilege Hierarchy & Complete 23-Module Standard Operating Procedures

# 1. Executive Platform Overview & Architecture
The LEADS Next Gen ERP Dashboard is a unified operations portal developed for the LEADS Next Gen Centre at MSRUAS. The platform coordinates 23 distinct operational modules, spanning event planning, task delegation, digital gate passes, mobile wallet integration (Apple Wallet & Google Wallet), multi-tier financial reimbursement audits, equipment procurement, dynamic form builders, and student performance ratings.
Key System Characteristics:
• Zero External Database Dependency: All data resides in encrypted collections (data/*.json) protected with AES-256-GCM encryption.
• Reactive Cross-Session Sync: Changes made by one user automatically propagate to other active sessions within 7 seconds via 'leads-data-sync' events.
• Cryptographic Credentials: Passwords are protected via Node's native scrypt hashing with unique 16-byte salts and timing-safe comparisons.
# 2. Role Privilege & Access Hierarchy (Tiers 1 to 7)
Access privileges are strictly partitioned into 7 authority tiers combined with organizational divisions:

# 3. Complete 23-Module Operational Guide
## 3.1 Home Dashboard
The executive landing page upon logging in. Displays KPI stat cards (Active Events, Open Tasks, Expenditure vs. Budget), an Action Required inbox highlighting pending approvals, upcoming calendar milestones, and recent system audit feeds.
## 3.2 Events Management
Coordinates event lifecycles: Proposal -> Approval -> Active Execution -> Completion -> Archival. Organizers can attach functional sub-committees (Stage, Logistics, Social Media, Hospitality), assign student leads, establish budgets, and monitor progress.
## 3.3 Event Passes & Live Scanner Kiosk
Enables pass creation and gate check-in. The Pass Studio generates badges with unique cryptographic serials and QR codes. On event day, gate volunteers use the camera-based Check-in Scanner on mobile or laptop for instant audio-visual check-in validation.
## 3.4 Apple Wallet & Google Wallet Integration
Delivers mobile digital passes. Attendees tap 'Add to Apple Wallet' to install .pkpass badges featuring event schedules and lock-screen notifications when near campus. Android users install passes to Google Wallet via one-click JWT links.
## 3.5 Tasks, Delegation & Gantt Timeline
Assigns deliverables to individuals or entire sub-committees. Includes priority levels, file attachments, and a Gantt Timeline visualizing critical path dependencies. Automatically sends email warnings 24 hours and 2 hours before deadlines.
## 3.6 Performance Ratings & Committee Evaluations
Conducts post-event reviews across standard institutional criteria: Timeliness, Deliverable Quality, Teamwork, and Initiative. Scores aggregate into student recognition records and departmental efficiency indexes.
## 3.7 Procurement & Equipment Requisitions
Coordinates resource sourcing (printing, electronics, stage equipment). Organizers upload vendor quotation estimates. Department Heads approve standard requests; high-value purchases route to the Centre Head for final clearance.
## 3.8 Financial Reimbursements (Dual-Gate Audit)
Student organizers submit claims with receipt photos. The dual-gate pipeline enforces: Gate 1 (Faculty Head verification) followed by Gate 2 (Centre Head clearance). Disbursed claims automatically debit linked event budgets.
## 3.9 Budgeting, P&L & Income Sources
Maintains departmental balance sheets. Tracks university allocations, external sponsorships, and ticket revenues with real-time calculation of Budget vs. Actual expenditure variances.
## 3.10 Design Portal & OCR Proofreading Engine
Manages promotional posters and social media creatives. The built-in AI OCR engine scans uploaded graphics to detect typos, mismatched dates, or spelling errors before designated Media Faculty provide final sign-off.
## 3.11 Dynamic Form Builder & Public Submissions
Builds custom RSVP, registration, and feedback surveys with custom public URLs (e.g., /forms/symposium-rsvp). Generates high-resolution QR codes and enables response exports to Word (.docx) and CSV.
## 3.12 Digital Visiting Cards & 3D Interactive Keycard
Every verified member receives a digital business card (/card/[slug]). Features an interactive 3D WebGL badge, one-tap vCard phone address book download, and Apple/Google Wallet pass installation.
## 3.13 Guest Directory & VIP Invitation Engine
Maintains records of guest lecturers, VIP dignitaries, and alumni. Features business card photo OCR to auto-populate contact profiles and one-click dispatch of formal personalized invitation emails.
## 3.14 Announcements & Scoped Broadcasts
Broadcasts notices scoped to All Members, Core Committee Only, or Faculty Only. Pinned alerts appear on the dashboard and trigger automated outbound notification emails.
## 3.15 Master Calendar & Festival Schedule
Unified institutional timetable displaying event dates, milestone deadlines, and university academic holidays across campuses. Supports one-click export to Google and Apple Calendar via iCal.
## 3.16 Executive Event Reports & PDF/Word Exports
Post-event documentation engine compiling executive summaries, attendance analytics, final financial balance sheets, and photo galleries into formatted PDF and Word (.docx) reports for university management.
## 3.17 Unified Approvals Inbox
A consolidated decision-making inbox for Tier 2/3 heads. Aggregates pending event proposals, procurement requests, reimbursement claims, and creative assets into a single list with inline approval actions.
## 3.18 Members Directory & User Management
Administers member accounts, promotions, division assignments, and offboarding. Generates cryptographic activation links for new inductees and supports forced password resets.
## 3.19 Custom Group Policies & Access Thresholds
Enables granular access control customization without code modifications, such as granting a specific student lead temporary access to financial budgeting modules.
## 3.20 Email Delivery Engine & Queue Logs
Monitors outbound email health (task reminders, birthday greetings, pass deliveries, and circulars) with real-time delivery receipts, bounce tracking, and SMTP test tools.
## 3.21 System & Security Settings
Configures institutional portal branding, SMTP mail relays (Google Workspace, Office 365, or local Postfix), and Apple/Google digital wallet credentials.
## 3.22 Encrypted Backup & Restore
Guarantees disaster recovery. Generates master-key encrypted .zip snapshot archives of all 28 database collections and uploaded files for offline institutional storage and point-in-time restoration.
## 3.23 Mobile PWA Installation
Enables users to install LEADS ERP onto Apple iOS or Android devices as a native-like application with offline asset caching and full-screen viewing.
# 4. Role-Specific Operational Workflows
## 4.1 Student Members & Training Associates (Tiers 5-6)
• Daily Routine: Log in to review assigned tasks on the Home Dashboard.
• Task Completion: Open the task, update notes, attach deliverable files, and click 'Submit for Review'.
• Expense Claim: After purchasing event items, take a photo of the bill, open Reimbursements, click '+ Submit Claim', and enter details.
• Networking: Share your personal QR code from Visiting Card or tap 'Save Contact' to exchange vCard details.
## 4.2 Event Organizers & Committee Leads (Tiers 3, 5)
• Planning: Create event proposal, define sub-committees (Stage, Logistics, Media), and assign student volunteers.
• Ticketing: In Event Passes -> Studio, issue attendee passes and dispatch automated email confirmations.
• Gate Check-in: Assign volunteers to operate the Check-in Scanner on mobile devices on event day.
• Closure: Ensure tasks are signed off, compile the Event Report, and score committee ratings.
## 4.3 Faculty Advisors & Department Heads (Tiers 2-4)
• Approvals: Check the Approvals inbox daily to clear event proposals and procurement requisitions.
• Reimbursement Audit: Review Gate-1 reimbursement claims, verifying bill scans against amounts claimed before approving.
• Quality Oversight: Inspect creative designs in the Design Portal and review post-event analytical reports.
## 4.4 Centre Head & Executive Leadership (Tier 2)
• Financial Oversight: Approve final Level-2 reimbursement payouts and major institutional capital expenditures.
• Strategic Planning: Review the master P&L budget sheet to allocate funding across upcoming academic semesters.
• VIP Engagements: Direct high-level dignitary invitations via the Guest Directory.
## 4.5 Super Users / System Administrators (Tier 1)
• Onboarding: Add new members in the Members Directory to trigger automated activation links.
• Maintenance: Review the Email Queue for delivery failures, check audit logs, and download weekly encrypted backups.
• Verification: Use the Persona Switcher to inspect the user interface from the perspective of any active account.
# 5. Troubleshooting & Frequently Asked Questions
Q: Sync & Multi-Device Updates
A: The application automatically polls and syncs data every 7 seconds. To force an immediate refresh, press F5 / Ctrl+R or navigate to any sidebar module.
Q: Expired Activation Links
A: Activation tokens expire after 48 hours for security. Contact an administrator to click 'Resend Activation Link' from the Members Directory.
Q: QR Scanner Camera Permissions
A: Ensure camera access is allowed in your browser settings. In low-light environments, tap the Flashlight button in the scanner or enter the serial manually.
Q: Receipt Upload Failures
A: Ensure the receipt scan is in JPG, PNG, or PDF format and does not exceed 10 MB.
Q: Apple Wallet Installation
A: Attendees must open the pass link in Safari on iOS 14+. If opened inside third-party apps (WhatsApp, Chrome), tap the browser icon to open in Safari.

— End of LEADS ERP Operations Manual —
© 2026 LEADS Next Gen Centre, M.S. Ramaiah University of Applied Sciences. All rights reserved.
| Platform: | LEADS ERP All-in-One Operations Portal (Production v2.0) |
| --- | --- |
| Institution: | LEADS Next Gen Centre, M.S. Ramaiah University of Applied Sciences (MSRUAS) |
| System Architecture: | Next.js 16 + React 19 + AES-256-GCM Encrypted Flat-File Store |
| Document Classification: | Official Institutional Operations Manual |
| Target Roles: | Tiers 1 to 7 (Super Users, Faculty Heads, Committee Leads, Students, Alumni) |
| Tier | Role Title | Division | Authorized System Scope |
| --- | --- | --- | --- |
| Tier 1 | Super User | Core Committee | Root platform authority, audit logs, encrypted snapshots, system configuration, policy overrides, and live persona switching. |
| Tier 2 | Centre Head | Faculty | Campus-wide authority, final event approvals, Level-2 reimbursement clearance, major procurement approval, and VIP guest directory. |
| Tier 2.5 | GG Campus Head | Faculty | Campus-specific oversight for Gnanagangothri (GG) campus operations and task coordination. |
| Tier 3 | Department Head / Event Lead | Faculty / Core | Directs specific departments (Events, Media, Stage, Logistics). Proposal approvals, Level-1 reimbursement audits, task delegation. |
| Tier 4 | Advisory Board / Faculty Advisor | Faculty | Strategic read access to institutional performance analytics, committee ratings, and event documentation. |
| Tier 5 | Core Committee Lead | Core Committee | Event setup, sub-committee member allocations, pass studio badge issuance, form builder, and task planning. |
| Tier 6 | Training Associate / Student | Training Assoc. | Personal dashboard: task execution & progress updates, reimbursement claim submission, and digital visiting card generation. |
| Tier 7 | Alumni / Guest | Alumni / Guest | Read-only access to relevant past archives, digital visiting card exchange, and public event passes. |