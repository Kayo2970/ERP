# Graph Report - ERP  (2026-09-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1682 nodes · 5222 edges · 123 communities (60 shown, 62 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 185 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5456af2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- permissions.ts
- apiError
- email-service.ts
- getAccessLevelSettingsServer
- server-db.ts
- local-data.ts
- permissions-server.ts
- CLAUDE.md (Root Architecture Guide)
- readCollection
- forms/page.tsx
- setup-superuser.js
- tasks/page.tsx
- Student Core Council (LEADS RUAS) Page
- ratings/page.tsx
- getEvents
- logAuditEvent
- app/page.tsx
- approval-sync.ts
- rate-limit.ts
- policies/page.tsx
- holiday-scheduler.ts
- guest-directory/page.tsx
- visiting-card-ocr.ts
- compilerOptions
- 3.0 Reimbursement Claim Submission
- Asset Intake & Validation (section)
- devDependencies
- reimbursements/page.tsx
- dependencies
- Member
- members/[id]/route.ts
- LEADS All-in-One Dashboard Full System Review
- onboarding-tour.tsx
- LEADS All-in-One Dashboard (Product)
- session.ts
- sync-status.ts
- approvals/page.tsx
- LEADS Dashboard Full Codebase Bug Audit
- LEADS ERP Interactive Prototype
- Member table
- event-reports/page.tsx
- avatar.tsx
- card.tsx
- announcements/page.tsx
- backup.ts
- Reimbursements Module (Actual Flow)
- Events and Tasks Management Subsystem (Main Module)
- app/layout.tsx
- package.json
- empty-state.tsx
- LEADS Next Gen Centre
- Reports & Analytics Module (PRD)
- chip.tsx
- LEADS Next Gen Centre - Student Advisory Council Slide
- Security & Encryption Strategy
- progress.tsx
- Organisation Hierarchy
- decrypt-backup.js
- Member & Committee Directory Module (PRD)
- generate_manual_docx.py
- archiver
- Deployment Workflow (Standing Instruction)
- deploy.sh
- dictionary-en-gb
- html2canvas
- isomorphic-dompurify
- jspdf-autotable
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- lucide-react
- @napi-rs/canvas
- nodemailer
- ogl
- pdfjs-dist
- react-dom
- recharts
- tesseract.js
- zod
- postcss.config.mjs
- Access Level Settings
- Outbound Email Architecture
- Dashboard Shell Frontend Architecture
- Repository Layout
- Standing Rule: Always Push to GitHub After Code Change
- LEADS Next Gen Centre BIMI Brand Logo
- file.svg (Next.js boilerplate icon)
- globe.svg (Next.js boilerplate icon)
- LEADS Dashboard App Icon
- body-bg-dark.jpg (Solo Leveling dark background)
- body-bg-light.jpg (Light-Mode Body Background)
- LEADS Next Gen Centre - RUAS Short Logo
- Light Mode Background Image
- Sung Jinwoo Dark Wallpaper (Solo Leveling)
- Sung Jinwoo Mobile Wallpaper (Glowing Blue Eyes)
- Next.js Logo (next.svg)
- Student Core Council (LEADS Next Gen Centre - RUAS)
- LEADS Next Gen Centre Organization Structure Chart
- LEADS Next Gen Centre - Our Leadership Slide
- Our Advisory Boards (LEADS Next Gen Centre RUAS)
- window.svg (Next.js boilerplate window icon)
- Apple Touch Icon (LEADS Logo)
- App Icon / Favicon (LEADS Next Gen Centre - RUAS logo)
- LEADS Next Gen Centre - RIAS Email Logo
- Leads Dashboard Logo (SVG)
- Charts (Reports Module) Spec
- Component Patterns
- Dark Mode
- Typography
- Login Page Copy
- Access to Reports by Role
- Backup & Restore Module
- Budget & Funds Module
- Calendar Module
- Design Portal Module
- Dynamic Group Policies Module
- Email Management & Client Module
- Guest Directory Module
- Guest Invites Dispatcher Module
- UI Aesthetics & Light Mode Styling
- LEADS Short Logo
- Solo Leveling Sung Jinwoo Dark Wallpaper

## God Nodes (most connected - your core abstractions)
1. `apiError()` - 163 edges
2. `requireSession()` - 152 edges
3. `mutateCollection()` - 128 edges
4. `logAuditEvent()` - 102 edges
5. `readCollection()` - 87 edges
6. `getAccessLevelSettingsServer()` - 86 edges
7. `getMembers()` - 56 edges
8. `isCentreHead()` - 52 edges
9. `getEvents()` - 51 edges
10. `serverPatch()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `Deployment Note: Single TrueNAS Instance` --semantically_similar_to--> `Self-Hosted Deployment (Hostinger KVM VPS)`  [INFERRED] [semantically similar]
  docs/changes-needed-for-claude.md → README.md
- `Vercel Deployment Plan` --semantically_similar_to--> `Self-Hosted Deployment (Hostinger KVM VPS)`  [INFERRED] [semantically similar]
  PROJECT DOCS/04-TechSpec-LEADSDashboard.md → README.md
- `Dynamic Public Form Builder & QR Codes (Demo)` --semantically_similar_to--> `Public Forms Builder Module`  [INFERRED] [semantically similar]
  demo/index.html → README.md
- `Reimbursements System Module` --semantically_similar_to--> `Reimbursement Portal Module (PRD)`  [INFERRED] [semantically similar]
  README.md → PROJECT DOCS/01-PRD-LEADSDashboard.md
- `Tasks Desk Module` --semantically_similar_to--> `Task Management Module (PRD)`  [INFERRED] [semantically similar]
  README.md → PROJECT DOCS/01-PRD-LEADSDashboard.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Proposed-to-Actual Tech Stack Evolution** — project_docs_01_prd_leadsdashboard_leads_all_in_one_dashboard, project_docs_04_techspec_leadsdashboard_recommended_stack, readme_tech_stack [INFERRED 0.75]
- **Access Tier System Evolution (6-Tier Plan to 7-Tier Actual)** — project_docs_01_prd_leadsdashboard_role_tier_system, readme_access_tiers_matrix, project_docs_leadsarchitecture_access_tiers [INFERRED 0.80]
- **Backend Sync Reliability Fixes** — docs_bugs_to_fix_write_mutex_permanently_breaks, docs_bugs_to_fix_cross_device_polling_never_updates, docs_bugs_to_fix_committee_tasks_invisible, docs_changes_needed_for_claude_backend_sync_spec [INFERRED 0.85]

## Communities (123 total, 62 thin omitted)

### Community 0 - "permissions.ts"
Cohesion: 0.06
Nodes (103): allSidebarItems, DashboardShell(), loadSeenActionIds(), NavSection, navSections, saveSeenActionIds(), SidebarItem, NotFoundScreen() (+95 more)

### Community 1 - "apiError"
Cohesion: 0.11
Nodes (48): GET(), POST(), DELETE(), PATCH(), GET(), POST(), GET(), POST() (+40 more)

### Community 2 - "email-service.ts"
Cohesion: 0.07
Nodes (50): GET(), POST(), POST(), RequestEmailChangeSchema, GET(), DELETE(), GET(), POST() (+42 more)

### Community 3 - "getAccessLevelSettingsServer"
Cohesion: 0.09
Nodes (44): DELETE(), DELETE(), PATCH(), POST(), GET(), maxDuration, POST(), DELETE() (+36 more)

### Community 4 - "server-db.ts"
Cohesion: 0.06
Nodes (53): Per-Collection Async Write Mutex, Write Mutex Permanently Breaks After First Error, NOTE: intentionally NOT gated with requireSession. The Forms dashboard, decryptData(), deriveKey(), encryptData(), EncryptedPayload, FIXED_SALT (+45 more)

### Community 5 - "local-data.ts"
Cohesion: 0.07
Nodes (50): Group Policies, BudgetPage(), CATEGORY_OPTIONS, CHART_COLORS, CURRENT_FY, CURRENT_FY_START, FINANCIAL_YEARS, MONTH_NAMES (+42 more)

### Community 6 - "permissions-server.ts"
Cohesion: 0.09
Nodes (48): PATCH(), GET(), POST(), DELETE(), PATCH(), GET(), POST(), AccessLevelSettings (+40 more)

### Community 7 - "CLAUDE.md (Root Architecture Guide)"
Cohesion: 0.07
Nodes (51): CLAUDE.md (Root Architecture Guide), accessLevelSettings Collection, accountActivations Collection, announcements Collection, auditLogs Collection, birthdayEmailLog Collection, budgets Collection, designs Collection (+43 more)

### Community 8 - "readCollection"
Cohesion: 0.11
Nodes (36): ActivateAccountSchema, GET(), POST(), ChangePasswordSchema, POST(), ConfirmEmailChangeSchema, POST(), ConfirmNewEmailSchema (+28 more)

### Community 9 - "forms/page.tsx"
Cohesion: 0.09
Nodes (43): GET(), buildCategoryChartData(), buildFieldCounts(), buildScaleChartData(), buildSubmissionsByDay(), CHART_COLORS, CHARTABLE_TYPES, chartCountDomainMax() (+35 more)

### Community 10 - "setup-superuser.js"
Cohesion: 0.06
Nodes (37): RFC-5321, Direct Send SMTP Setup, DKIM/SPF/DMARC DNS Configuration, Full DNS Rebuild & Mail Verification, Super User Setup Process, PM2/Nginx/Certbot Bootstrap, VPS Setup Bootstrap Procedure, log() (+29 more)

### Community 11 - "tasks/page.tsx"
Cohesion: 0.16
Nodes (38): DesignPortalPage(), FestivalsPage(), TasksPage(), DelegateTaskModal(), DelegateTaskModalProps, addDesign(), addTask(), approveTask() (+30 more)

### Community 12 - "Student Core Council (LEADS RUAS) Page"
Cohesion: 0.06
Nodes (41): Abhijit Arya (Senior Vice President), Arvind Rakshith (Senior Head, Finance and Sponsorship), Bharvi A Padia (Senior Head, Public Relations), Bhawen Maroo (Senior Head, Events and Operations), Gurutejas C (Senior President), LEADS Next Gen Centre Student Council - Student Advisory Council Slide, Laksh Soorya Singh (Senior Head, Events and Operations), Shri Pranab Mukherjee (Former President of India, quoted) (+33 more)

### Community 13 - "ratings/page.tsx"
Cohesion: 0.12
Nodes (35): isDesignTask(), RatingsPage(), ReportsPage(), PeriodFilter(), PeriodFilterProps, getRatingColor(), addRating(), deleteRating() (+27 more)

### Community 14 - "getEvents"
Cohesion: 0.16
Nodes (35): CalendarPage(), EventDetailPage(), EventsPage(), EventStatusFilter, DashboardHome(), StudentProfileModal(), StudentProfileModalProps, addEvent() (+27 more)

### Community 15 - "logAuditEvent"
Cohesion: 0.17
Nodes (37): DirectoryPage(), SettingsPage(), useUploadTask(), addMember(), adminSetMemberPassword(), approveMemberCreate(), AuditLogItem, authHeaders() (+29 more)

### Community 16 - "app/page.tsx"
Cohesion: 0.09
Nodes (25): INSPIRATIONAL_QUOTES, LoginPage(), QuoteItem, SetupPage(), IosInstallPrompt(), isIos(), isStandalone(), LoadingScreen() (+17 more)

### Community 17 - "approval-sync.ts"
Cohesion: 0.10
Nodes (27): GET(), maxDuration, POST(), DELETE(), PATCH(), PENDING_APPROVAL_MESSAGE, PENDING_STATES, AUTO_RECREATED_WORKFLOWS (+19 more)

### Community 18 - "rate-limit.ts"
Cohesion: 0.13
Nodes (29): accountBackoff, AUTH_MAX(), AUTH_WINDOW_MS(), AUTHENTICATED_MAX(), AUTHENTICATED_WINDOW_MS(), BACKOFF_BASE_MS(), BACKOFF_MAX_MS(), BACKOFF_RESET_AFTER_MS() (+21 more)

### Community 19 - "policies/page.tsx"
Cohesion: 0.10
Nodes (28): ALL_DIVISIONS, ALL_TIERS, EVERYONE_ELSE_RULE, GroupPoliciesPage(), memberMatchesCriteria(), ModuleAccessGrant, ModuleAccessMap, slugifyTag() (+20 more)

### Community 20 - "holiday-scheduler.ts"
Cohesion: 0.13
Nodes (25): RFC-5545, register(), BirthdayEmailLogEntry, monthDay(), msUntilNextMidnight(), runBirthdayCheck(), startBirthdayScheduler(), todayDateString() (+17 more)

### Community 21 - "guest-directory/page.tsx"
Cohesion: 0.13
Nodes (24): EmailManagementPage(), PendingQueueItem, emptyForm, GuestDirectoryPage(), applyMailMerge(), Guest, GuestInvitesPage(), ConfirmModal() (+16 more)

### Community 22 - "visiting-card-ocr.ts"
Cohesion: 0.13
Nodes (28): ADDRESS_KEYWORDS, cleanOcrLine(), convertPdfToImageBuffers(), DEPARTMENT_MARKERS, DESIGNATION_KEYWORDS, execFileAsync, ExtractedCardDetails, getWorker() (+20 more)

### Community 23 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 24 - "3.0 Reimbursement Claim Submission"
Cohesion: 0.09
Nodes (28): Allocation Data (input), 1.0 Annual Budget Allocation, 1.1 Budget Module (Stores & Manages Allocation), 3.1 Claim Validation (Syntax Checks), 8.0 Financial Reporting, Funding Available? (Decision), Funding Denied (Holds Claim, Notifies Finance), Grants (input) (+20 more)

### Community 25 - "Asset Intake & Validation (section)"
Cohesion: 0.16
Nodes (26): AI-Powered OCR Scan & Data Extraction, Answer Ingestion & Data Capture, Asset Intake & Validation (section), Auto-Complete Linked Tasks & Requirements, Combined Gates Pass Decision, Data Processing & Document Generation (section), Design Asset Upload, DOCX Document Generated & Stored (+18 more)

### Community 26 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/adm-zip (+17 more)

### Community 27 - "reimbursements/page.tsx"
Cohesion: 0.18
Nodes (21): BackupRestorePage(), ReimbursementsPage(), createProgressTracker(), FileDropzone(), FileDropzoneProps, FilePreviewRow(), FilePreviewRowProps, formatEta() (+13 more)

### Community 28 - "dependencies"
Cohesion: 0.09
Nodes (23): adm-zip, core-js, dictionary-en, gsap, jspdf, jszip, dependencies, adm-zip (+15 more)

### Community 29 - "Member"
Cohesion: 0.16
Nodes (23): Announcements Engine, Budget & Funds, Design Portal, Dynamic Group Policies, Events Desk, Executive Reports, Guest Directory, Public Forms (+15 more)

### Community 30 - "members/[id]/route.ts"
Cohesion: 0.23
Nodes (18): DELETE(), PATCH(), POST(), POST(), DELETE(), PATCH(), POST(), ActivationToken (+10 more)

### Community 31 - "LEADS All-in-One Dashboard Full System Review"
Cohesion: 0.11
Nodes (19): REST API Layer (One Folder Per Collection), Flat JSON File Database, Cross-Device Polling Never Actually Updates Open Screen, Backend Sync Fix Implementation Spec, Deployment Note: Single TrueNAS Instance, Fix Load Race: Server Data Must Win Over Seed Data, Add Live Sync Between Open Sessions (Polling), Split Into Per-Collection Per-Record API Routes (+11 more)

### Community 32 - "onboarding-tour.tsx"
Cohesion: 0.13
Nodes (15): OnboardingTourProps, OnboardingTourUser, TourStep, PromotionData, PromotionModal(), PromotionModalProps, Button(), ButtonColor (+7 more)

### Community 33 - "LEADS All-in-One Dashboard (Product)"
Cohesion: 0.13
Nodes (18): Announcements & Email Alerts Module (PRD), LEADS All-in-One Dashboard (Product), Reimbursement Portal Module (PRD), Task Management Module (PRD), Dashboard Route Tree, Public /forms/[slug] Route Group, Color Palette, Announcements Copy (+10 more)

### Community 34 - "session.ts"
Cohesion: 0.20
Nodes (11): POST(), POST(), POST(), canManageBackup(), extractToken(), getSession(), getSessionMember(), hashToken() (+3 more)

### Community 35 - "sync-status.ts"
Cohesion: 0.26
Nodes (13): SyncStatusPill(), beginSync(), dismissSyncEntry(), entries, getSyncEntries(), getSyncSuccessFlash(), listeners, notify() (+5 more)

### Community 36 - "approvals/page.tsx"
Cohesion: 0.26
Nodes (13): ApprovalsPage(), entityIcon(), entityLink(), statusBadge(), Tab, RequestApprovalModal(), RequestApprovalModalProps, ApprovalRequest (+5 more)

### Community 37 - "LEADS Dashboard Full Codebase Bug Audit"
Cohesion: 0.14
Nodes (14): Event Proposals & Orchestration (Demo), Audit Log Unbounded on Client, Capped Inconsistently on Server, Settings Change Password Is Fully Decorative, Dead Un-Mutex'd Write Path in /api/data, getCommittees() Fallback List Doesn't Reflect Per-Event Model, LEADS Dashboard Full Codebase Bug Audit, Public Form Slugs Not Checked for Uniqueness Server-Side, Test-Persona Tiers Contradict App's Own Role/Tier Table (+6 more)

### Community 38 - "LEADS ERP Interactive Prototype"
Cohesion: 0.17
Nodes (13): Dynamic Public Form Builder & QR Codes (Demo), LEADS ERP Interactive Prototype, Member Performance & Evaluation (Demo), Task Traceability Matrix (Demo), Committee-Assigned Tasks Invisible to Everyone, Duplicated Permission Logic Across Screens, Rating & Evaluation Module (PRD), Rating Module Copy (+5 more)

### Community 39 - "Member table"
Cohesion: 0.31
Nodes (13): Announcement table, Budget table, Design table, Event table, GroupPolicy table, Guest table, Member table, PublicForm table (+5 more)

### Community 40 - "event-reports/page.tsx"
Cohesion: 0.38
Nodes (12): EventReportsPage(), addEventReport(), approveEventReport(), deleteEventReport(), EventReportItem, getEventReports(), rejectEventReport(), resubmitEventReport() (+4 more)

### Community 41 - "avatar.tsx"
Cohesion: 0.15
Nodes (9): Avatar(), AvatarColor, AvatarContext, AvatarContextValue, AvatarFallbackProps, AvatarGroupProps, AvatarImageProps, AvatarProps (+1 more)

### Community 42 - "card.tsx"
Cohesion: 0.18
Nodes (7): CardBodyProps, CardFooterProps, CardHeaderProps, CardProps, createParticleElement(), ParticleCard(), ParticleCardProps

### Community 43 - "announcements/page.tsx"
Cohesion: 0.41
Nodes (11): AnnouncementsPage(), addAnnouncement(), AnnouncementItem, approveAnnouncement(), deleteAnnouncement(), getAnnouncements(), getCommittees(), getEventCommittees() (+3 more)

### Community 44 - "backup.ts"
Cohesion: 0.30
Nodes (10): BackupSummary, buildZipBuffer(), createEncryptedBackup(), DATA_DIR, decryptBackup(), deriveKey(), InvalidPassphraseError, listFilesRecursive() (+2 more)

### Community 45 - "Reimbursements Module (Actual Flow)"
Cohesion: 0.18
Nodes (11): Dual-Level Reimbursement Pipeline (Demo), Reimbursement Approval Stage Not Enforced by Role, Two-Stage Reimbursement Approval Not Implemented, Permission Hierarchy & RBAC (leads-dashboard/README.md), 6-Tier Role System (PRD), Security & Access Control (PRD), Access Matrix by Route Group, Access Tiers (Actual 7-Tier System) (+3 more)

### Community 46 - "Events and Tasks Management Subsystem (Main Module)"
Cohesion: 0.25
Nodes (11): All Required Tasks Complete? (decision), 2. Committee Rosters Module, 5. Completion Triggers Module, 4. Deliverable Tracking Module, End: Event Concluded, 1. Event Creation Module, Events and Tasks Management Subsystem (Main Module), Reject/Correct Request (+3 more)

### Community 47 - "app/layout.tsx"
Cohesion: 0.24
Nodes (7): geistMono, geistSans, metadata, HapticFeedbackProvider(), HapticPattern, PATTERNS, triggerHaptic()

### Community 48 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, setup, start (+1 more)

### Community 49 - "empty-state.tsx"
Cohesion: 0.24
Nodes (5): EmptyStateProps, Ripple, RippleButton, RippleButtonProps, SkeletonProps

### Community 50 - "LEADS Next Gen Centre"
Cohesion: 0.36
Nodes (10): Dr. Ajay R (Finance Head and Auditor), Dr. Kiran Kumar B M (Head Events, RTC), Dr. K. M. Sharath Kumar (Chief Advisor), Dr. Kuldeep Kumar Raina (Patron), LEADS Next Gen Centre Leadership Slide (Page 4), LEADS Next Gen Centre, Dr. Pallabi Mund (Head Events, GG), Ramaiah University of Applied Sciences (RUAS) (+2 more)

### Community 51 - "Reports & Analytics Module (PRD)"
Cohesion: 0.25
Nodes (8): Institutional Reports & Analytics (Demo), No PDF Export Exists (Only CSV), Reports & Analytics Module (PRD), Reports Module Copy, PDF/CSV Export, Report Types (By Event/Committee/Individual), Reports Module (Actual Flow), Analytics & Reports Module

### Community 52 - "chip.tsx"
Cohesion: 0.25
Nodes (7): ChipColor, ChipProps, ChipSize, ChipVariant, COLOR_VARIANTS, DOT_COLORS, SIZES

### Community 53 - "LEADS Next Gen Centre - Student Advisory Council Slide"
Cohesion: 0.25
Nodes (8): Abhijit Arya - Senior Vice President, Arvind Rakshith - Senior Head, Finance and Sponsorship, Bharvi A Padia - Senior Head, Public Relations, Bhawen Maroo - Senior Head, Events and Operations, Gurutejas C - Senior President, Laksh Soorya Singh - Senior Head, Events and Operations, LEADS Next Gen Centre - Student Advisory Council Slide, Shreesha S N - Senior Head, Design and Social Media

### Community 54 - "Security & Encryption Strategy"
Cohesion: 0.29
Nodes (7): Tier-Based Access Control, Bank Account Details Rendered Unmasked, Vercel Deployment Plan, Security & Encryption Strategy, Recommended Stack (Next.js/Supabase/Vercel), Row-Level Security Access Control, Tech Stack (Actual)

### Community 55 - "progress.tsx"
Cohesion: 0.29
Nodes (5): COLOR_TRACKS, ProgressColor, ProgressProps, ProgressSize, SIZES

### Community 56 - "Organisation Hierarchy"
Cohesion: 0.40
Nodes (5): Student Roster & Committee Reference Images, Faculty & Institutional Leadership, Organisation Hierarchy, Student Advisory Council, Student Core Council

### Community 57 - "decrypt-backup.js"
Cohesion: 0.40
Nodes (4): crypto, fs, path, resolvedPath

### Community 58 - "Member & Committee Directory Module (PRD)"
Cohesion: 0.50
Nodes (4): Member & Committee Directory Module (PRD), CSV Import Sync Gap, Directory Module (Actual Flow), Member Directory & Roster Module

### Community 59 - "generate_manual_docx.py"
Cohesion: 0.83
Nodes (3): create_manual(), set_cell_background(), set_cell_margins()

## Ambiguous Edges - Review These
- `GroupPolicy` → `Submission`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: references
- `Guest` → `Member`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: references
- `Rating (upper, form-linked)` → `Rating (lower, member/event score)`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: conceptually_related_to
- `Rating (lower, member/event score)` → `Task`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: references
- `Budget & Funds` → `Ratings & Performance`  [AMBIGUOUS]
  leads-dashboard/docs/module_data_flow_diagram.png · relation: shares_data_with
- `Announcement table` → `GroupPolicy table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Announcement table` → `Rating table (event-linked)`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Design table` → `Guest table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Design table` → `Reimbursement table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `GroupPolicy table` → `Submission table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Guest table` → `Member table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Rating table (event-linked)` → `Task table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Rating table (form-linked)` → `Task table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to

## Knowledge Gaps
- **420 isolated node(s):** `NavSection`, `SidebarItem`, `RatingReviewerRole`, `SessionUser`, `DeliveryResult` (+415 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 466 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `GroupPolicy` and `Submission`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Guest` and `Member`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Rating (upper, form-linked)` and `Rating (lower, member/event score)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Rating (lower, member/event score)` and `Task`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Budget & Funds` and `Ratings & Performance`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `Announcement table` and `GroupPolicy table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Announcement table` and `Rating table (event-linked)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._