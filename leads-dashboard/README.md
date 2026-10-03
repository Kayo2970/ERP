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
- **Assigned Tasks Tile**: Counts only tasks still needing action (not Completed), scoped to the current calendar year so it resets each January instead of accumulating stale, long-overdue tasks.

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
- **Auto-Emails**: Assignees are emailed on assignment (debounced into a digest), on any substantive edit (due date, title, description, assignee — a plain status toggle stays silent), and via a daily reminder the day before the deadline.

#### 5. Ratings & Student Performance (`/dashboard/ratings`)
- **Multi-Reviewer Independent Rubric**: 4-way independent leadership evaluation rubric (**Super User**, **Centre Head**, **Advisor**, and **GG Campus Events Head**).
- **Live Aggregate Averaging**: Reviews submitted by any panel member automatically compute into a live composite average score.
- **Design Evaluation Lane**: Dedicated evaluation slot for the Design Head on creative deliverables.
- **Searchable Combobox Filters**: Quick search filters for students and events with custom monthly or date-range filtering.
- **Faculty Cannot Be Rated**: Faculty division members are excluded from every task assignee/group/committee picker, so they can never enter the ratings pipeline as a target.
- **Neutral Default Scores**: New evaluation sliders start at `3` (Satisfactory), not `5`, so an unedited submission never silently reads as a perfect score.
- **Zero Means Zero**: Members with no ratings at all show an explicit `0.0` average on the Leaderboard and Student Profile, never a placeholder that could be mistaken for a real score.

#### 6. Approvals & Governance Desk (`/dashboard/approvals`)
- **Centralized Approvals Inbox**: Dedicated management hub for pending sign-offs across Announcements, Tasks, Events, Designs, Event Reports, Members, and Committees.
- **In-Card Rich Overview Previews**: Each card includes an immediate preview snippet (announcement scope & message body, task brief & due date, event dates & venue, design thumbnail & category, report file specs).
- **Interactive Deep Overview Modal**: One-click modal inspection showing un-truncated content bodies, attachments, requester messages, and embedded **Approve / Reject** buttons with optional decision notes.
- **Multi-Panel Auto-Sync**: Sibling requests for Centre Head, Advisor, and GG Events Head automatically resolve when any panel member decides.
- **Role-Gated Approver Resolution**: Approver discovery explicitly excludes financial roles (`Finance Head`) from `eventsHeadGg` resolution, ensuring institutional event, report, and design approval emails reach only authorized event leadership.

#### 7. Design Portal (`/dashboard/designs`)
- **Asset Review Desk**: Dedicated portal for Design and Social Media department asset requests, proofreading, and approval workflows.
- **Dual Review Pipeline**:
  - *Proofreading Gate*: Assign proofreaders with change requests or plain approval.
  - *Style Approval Gate*: Final Design Head / Centre Head sign-off.
- **Asset Management**: File uploads with image previews, OCR text scanning, and automated completed task synchronization.
- **Design Task Requests Queue**: Design-brief Tasks awaiting a submission surface here for whoever they're assigned to, including committee assignments.
- **Tabbed Review Inspector**: The proofread/style/social-workflow review modal is split into focused tabs (Overview, Proofreading, Style Approval, Social Workflow) instead of one long scroll.
- **Faculty-Only Proofreaders**: Proofreader selection is restricted to Faculty division members; within that, only Centre Head, Advisor, or Head of Design.

#### 8. Event Passes & Gate QR Scanner (`/dashboard/event-passes`)
- **Digital Event Passes**: Event pass cards with unique serial numbers and a QR code. Only events created in the Events module can be selected (synced holidays/festivals are hidden). Per-pass text and label colours can be set in the Studio.
- **What you design is what is issued**: the Studio preview and the Edit Pass dialog render the very same keycard component as the public `/pass/<serial>` page (folder, extracting card, QR), including the event's pass look.
- **Full pass editing**: *Edit* on an issued pass changes everything — attendee details, event (dates/venue follow), pass type and category, venue, valid days, status, notes, gradient/solid colours and text/label colours — with a live preview and wallet re-sync.
- **Designer drop-downs**: the Studio and Edit Pass are grouped into *1 · Event & guest details*, *2 · Colours & text* (solid/gradient, text colours, font size), *3 · Event artwork & logo* and *4 · QR code* (shape square/rounded/dots, dot/background/corner-eye colours, centre logo, wallet barcode type and caption, optional *styled QR inside the wallet pass* which replaces Apple's native barcode). **Email is mandatory** (single, edit and bulk CSV) because the pass is delivered there.
- **Wallet pass = designed poster**: the Apple/Google Wallet pass uses a poster rendered by the portal (`/api/pass/<serial>/wallet-poster`, same renderer as the Studio's Apple Wallet preview) with your artwork/colours/font size and a dark fade so Apple's field row stays readable. Apple's own elements (logo, header, barcode panel, one row of short fields) are positioned as on a real iPhone pass in the preview (`lib/wallet-poster-spec.ts`).
- **Wallet loading bar**: *Add to Apple/Google Wallet* (pass page and email buttons → `/pass/<serial>/wallet?to=apple|google`) shows a progress bar that climbs to ~95% in 5 s, creeps slowly, and jumps to 100% when the pass is ready (it is created once, then cached).
- **Wallet stays in step with edits**: the wallet pass always uses a *dark* base colour (Apple picks text colour from it, so white text on the poster). Editing a pass whose Apple/Google copy a guest already took pushes the full updated pass to their phone live; editing one nobody has taken yet rebuilds it with the new design on the next *Add* (the old one is revoked). Edit Pass shows the wallet status and has a *Re-issue wallet pass* button. Set `WALLET_DEBUG=1` to log the exact request sent to WalletWallet (key not logged).
- **Event title on the wallet pass**: set the default for the whole event in the *Pass look* editor (Auto / Always show / Hide, right under the wallet preview); each pass can override it from the quick toggle under the Apple Wallet preview in the Studio / Edit Pass.
- **Multi-Day Passes (one pass, one QR)**: A pass is valid on a chosen set of event days (day picker in the Studio; `ValidFrom`/`ValidTo` columns in the bulk CSV). Attendance is recorded once per day; the pass page shows "Checked In (n/m days)".
- **Gate QR Scanner**: In-app camera scanner. Days come from the pass itself, check-in is allowed only on a valid day, cancelled and expired passes are refused, and check-in is enforced server-side (`POST /api/events/all/passes/checkin`) so concurrent scanners cannot overwrite each other.
- **Invitee Pass Page** (`/pass/[serial]`): the full "LEADS Executive Key Card" folder animation (folder opens, card slides out, flips), a Skip animation option, reduced-motion support, and Add to Wallet / Calendar / Share actions. The public API returns no email, phone or notes.
- **Emailed Boarding-Pass Ticket**: A server-rendered 1200 × 460 PNG (QR, name, event, venue, valid days) is inlined in pass emails and the mail-merge (`@pass_image`). The ticket card is 1160 × 420 (main area 870 px, white tear-off stub 290 px with a 220 × 220 QR).
- **Email Buttons**: Add to Apple Wallet, Add to Google Wallet, Add to Calendar and View Digital Pass point at this portal. The wallet pass is created **once, on the first click**, and cached (one WalletWallet call yields both Apple and Google; simultaneous clicks share one call; a failure backs off 60 s). Calendar files are built locally.
- **Pass Look (per event)**: Background artwork, logo and colours applied to the portal card, the emailed ticket and the Wallet pass. The **email ticket can have its own design** (separate 1160 × 420 artwork, colours and darkening, with a downloadable safe-zone template). The Wallet receives a portrait 690 × 1010 crop as a **public HTTPS URL**; with a background, iOS 27 uses Apple's poster layout (one header, up to four primary and two footer fields, white text), with a live poster preview in the Studio. Background, logo and footer fields need a WalletWallet Pro key.
- **30-Day Retention**: 30 days after an event ends, pass links (page, wallet, calendar, ticket image) show a "Thank you for being part of <event>… follow us" page with the centre's social links, and a daily scheduler deletes cached wallet files and theme images. Wallet passes already on phones are not revoked.
- **One Pass Email, Everywhere**: Mail-Merge Dispatch and the Issued Passes **Preview & dispatch** use the same message: an editable subject/body with `@placeholders` (`@name`, `@event_name`, `@valid_days`, `@pass_image`, `@details`, …, saved in the browser) inside one designed layout (wide boarding-pass ticket, details table, Apple/Google Wallet + Calendar + View buttons). Both screens are wide on desktop and show the exact email that will be sent. In Issued Passes you can tick passes (or select all), step through each pass and its email with the arrow buttons / ← → keys, skip or fix recipients, and dispatch in bulk with per-pass results and Retry failed.
- **Pass Governance**: Re-send pass emails, revoke invalid passes (also revoked in the wallet), or delete records (cached files are removed too).

#### 9. Digital Visiting Card & Wallet Passes (`/dashboard/visiting-card` & `/card/[slug]`)
- **Public Visiting Card**: Dynamic `/card/[slug]` landing page featuring member profile, designation, direct phone/LinkedIn links, and instant VCF vCard download.
- **Interactive Image Cropper**: Multi-aspect ratio image cropping modal with zoom, pan, and centering controls for avatars and visiting cards.
- **Apple & Google Wallet Passes**: Automated wallet pass generation via WalletWallet API with QR codes, caching, and rate-limited regeneration (2 per 15-day window). Logo/photo URLs now point at the live production domain rather than a stale pre-migration one.

---

### 🛡️ Administration & Governance Modules

#### 10. Reimbursements System (`/dashboard/reimbursements`)
- **Expense Claims**: Expense submission desk with receipt proof attachments and amount validation.
- **Two-Stage Approval Pipeline**: Stage 1 (Sector Head) verification followed by Stage 2 (Finance Head) sign-off.
- **Auto-Emails**: Centre Head(s) emailed on submission; claimant and Finance Head(s) emailed at every decision (verified, approved, denied), with delivery status recorded on the claim.

#### 11. Budget & Funds (`/dashboard/budget`)
- **Financial Governance**: Ledger for university fund allocations, department budgets, and operational expenditures.
- **Smart Sponsorship Calculation Engine**:
  - *Sponsor Depletion First*: Event expenses deplete sponsor funds before touching the Centre's allocation.
  - *Sponsor Surplus Return Rule*: Unused event sponsorship returns to the Centre's main account.
  - *Total Available Capital*: Real-time formula: `Annual Approved Budget + General Income/Grants + Returned Sponsor Surplus`.
- **Multi-Year Budgeting Engine**: Extended 9-year Financial Year selector (`-5` years back to `+3` years forward).
- **Auto-Emails**: Same submit/decision email flow as Reimbursements.

#### 12. Public Forms Builder (`/dashboard/forms` & `/forms/[slug]`)
- **Interactive Form Builder**: Custom form engine for student signups, feedback collection, and event registrations.
- **Instant QR Code & Poster Download**: Generates high-res printable poster PNG cards with branding header and scannable QR code.
- **Official Word (DOCX) Export**: Built-in Feedback Form template generates field-for-field filled copies matching `Feedback_Events.docx`.
- **Paged Submissions**: the received-responses table shows 10 / 15 / 20 rows per page with page navigation and a "Showing a–b of N" counter (same pattern as the Members directory); CSV export still includes everything.
- **Manage Templates**: every template, including the built-in Event Registration and Feedback templates, can be edited and deleted. Edited built-ins are badged "Edited" with a Reset button; deleted built-ins are listed under "Deleted built-in templates" with a Restore button.
- **Default Values**: any question can have a default answer (typed, a chosen option, ticked choices, a scale value, or a ticked checkbox). Short-text questions can instead be filled from the **linked event's name, date or venue**, which stays current if the event is renamed or rescheduled. Respondents can still change the pre-filled answer.

#### 13. Analytics & Reports (`/dashboard/reports`)
- **Executive Report Generator**: Styled PDF report generation and CSV data exports for scorecards, event post-mortems, and financial audits.
- **Evaluator Attribution**: The bar chart tooltip and the PDF's Event-wise Breakdown table both show who submitted each score, not just the score itself.
- **High-Contrast Chart Tooltips**: Deliverable Performance Distribution and radar charts feature dedicated dark-mode high-contrast tooltips ensuring full readability of scores, task averages, and evaluator breakdowns.
- **Audited Performance Context**: The Audited Performance Logs table displays each student's department context beneath their name, and chart X-axis labels are padded to eliminate clipping.

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
- **Grant Notification Emails**: Automatically sends customized notification emails (`GROUP_POLICY_GRANT`) to targeted members whenever elevated privileges or special temporary access are granted, detailing the granting authority, validity duration / expiration period, specific capabilities, and module access overrides.

#### 19. Backup & Restore (`/dashboard/backup`)
- **Snapshot Manager**: Export and restore AES-256 encrypted JSON database snapshots with rollback protection.
- **Server Storage Panel**: Upload usage per category, files no record points to (orphans, ignoring anything under an hour old), largest files, and one-click cleanup of orphans and old pre-restore snapshots.
- **Delete Means Delete**: Deleting an event also removes its passes, reports, designs, tasks and forms with their files (finance records are kept); deleting a member removes their avatar, card photo, wallet file and tokens; removed task attachments and reimbursement receipts are deleted from disk.

#### 20. Email Management & Client (`/dashboard/email`)
- **SMTP Engine**: Diagnostic testing, live queue monitoring, test email delivery, and dispatch logs.
- **Universal 10-Minute Buffer Queue**: Every outgoing email across all ERP modules is placed in a 10-minute quiet hold before physical SMTP dispatch. Features live 1-second countdown tickers, manual "Dispatch Now", and "Cancel Send" controls for individual or all queued emails.
- **File Attachments** on the Broadcast Composer, same as Mail Merge.
- **Debounced Task-Assignment Digest**: batches task-assignment emails per recipient over a 10-minute window — now fires correctly for tasks created automatically by the in-process schedulers, not just ones created via the Tasks page, and survives a mid-debounce server restart (flushed on shutdown instead of dropped).
- **Group Policy Module**: Full support for `GROUP_POLICY_GRANT` category logging, filtering, and payload inspection.

#### 21. System & Account Settings (`/dashboard/settings`)
- **Profile & Security**: Avatar upload, OTP-verified email updates, password change, and Super User Emergency System Lockdown.
- **Integrations (Super User)**: The WalletWallet API key (with a **Check key** button) and the centre's social account URLs used on thank-you pages.

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
