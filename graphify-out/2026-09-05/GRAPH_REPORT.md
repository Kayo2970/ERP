# Graph Report - ERP  (2026-09-05)

## Corpus Check
- Large corpus: 225 files · ~605,838 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1700 nodes · 5078 edges · 134 communities (68 shown, 62 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 193 edges (avg confidence: 0.9)
- Token cost: 0 input · 2,420,029 output

## Community Hubs (Navigation)
- Dashboard Shell & Layout
- Approval Requests & Auth Email
- Access Level & Approval APIs
- Calendar/Home/Ratings Pages
- Budget/Income/Design APIs
- Group Policies & Submissions
- Data Collections Overview
- Directory & Guest Pages
- OCR Spellcheck
- Announcements & Event Reports API
- Forms Page Charts
- Designs/Festivals/Tasks Pages
- Backup/Reports/Settings Pages
- Designs & Event Reports API
- Auth Activation & Login API
- Login & Setup Pages
- Deployment & Email Setup Guides
- Events Pages & Local Data
- TypeScript Config
- Finance Module Diagram (docs)
- Budget Page UI
- Finance Module Diagram (dashboard docs)
- ESLint & Dev Dependencies
- Group Policies Page
- Zip/Archive Dependencies
- Encryption Utilities
- Form Templates & OCR Scan API
- Announcements & Email Pages
- Designs & Forms Module Diagram (docs)
- Student Core Council Roster
- Designs & Forms Module Diagram (dashboard docs)
- Backup & Restore
- Email Logs & Queue API
- Members Bulk & ID API
- Sync Status Component
- Approvals Page
- PRD Modules Overview
- Holiday Scheduler (iCal)
- Promotion Modal & UI Buttons
- Tier-Based Access Control
- Reimbursement Pipeline & Bugs
- Database ER Diagram (docs)
- Database ER Diagram (dashboard docs)
- Avatar Component
- Card Component
- API Layer & Sync Bugs
- Student Advisory Council Slide
- Org Structure Chart
- Known Bugs Tracker
- Module Data Flow Diagram (docs)
- Events & Tasks Module Diagram (docs)
- Module Data Flow Diagram (dashboard docs)
- Events & Tasks Module Diagram (dashboard docs)
- Tech Stack & Design System
- Root Layout & Fonts
- Package Scripts
- UI Components (Empty State/Ripple)
- Leadership Team Slide
- Reimbursements Page & Local Data
- Button Component
- Student Advisory Council (dup slide)
- Public Form Builder Module
- Recommended Fixes & Design System
- Progress Component
- Reports & Analytics Module
- Event Management Module
- Backup Decryption Script
- Manual DOCX Generator Script
- Deployment Workflow Doc
- core-js Dependency
- deploy.sh Entry
- gsap Dependency
- isomorphic-dompurify Dependency
- jspdf Dependency
- AGENTS/CLAUDE Doc Pair
- ESLint Config File
- Next Config File
- dictionary-en Dependency
- html2canvas Dependency
- lucide-react Dependency
- next Dependency
- nspell Dependency
- pdfjs-dist Dependency
- react-dom Dependency
- recharts Dependency
- types/qrcode Dependency
- PostCSS Config File
- Access Level Settings (doc)
- Email Architecture (doc)
- Frontend Dashboard Shell (doc)
- Repository Layout (doc)
- Standing Push-to-GitHub Rule (doc)
- BIMI Brand Logo Asset
- file.svg Boilerplate Icon
- globe.svg Boilerplate Icon
- App Favicon Asset
- Dark Body Background Image
- Light Body Background Image
- LEADS Short Logo Image
- Light Background Image
- Sung Jinwoo Dark Wallpaper
- Sung Jinwoo Mobile Wallpaper
- Next.js Logo Asset
- Student Core Council Slide (dashboard copy)
- Org Structure Chart (dashboard copy)
- Leadership Team Slide (dashboard copy)
- Advisory Boards Slide
- Vercel Logo Asset
- window.svg Boilerplate Icon
- Apple Touch Icon Asset
- App Router Favicon Asset
- Email Logo Asset
- LEADS Small SVG Logo
- Charts & Reports Module (design doc)
- Component Patterns (design doc)
- Dark Mode Spec (design doc)
- Typography Spec (design doc)
- Login Page Copy (content doc)
- Reports Access Spec (doc)
- Backup & Restore Module (README)
- Budget & Funds Module (README)
- Calendar Module (README)
- Design Portal Module (README)
- Dynamic Group Policies Module (README)
- Email Management Module (README)
- Guest Directory Module (README)
- Guest Invites Dispatcher (README)
- UI Aesthetics (README)
- LEADS Short Logo (reference asset)
- Sung Jinwoo Wallpaper (reference asset)

## God Nodes (most connected - your core abstractions)
1. `requireSession()` - 152 edges
2. `sessionErrorStatus()` - 150 edges
3. `mutateCollection()` - 128 edges
4. `logAuditEvent()` - 102 edges
5. `readCollection()` - 87 edges
6. `getAccessLevelSettingsServer()` - 86 edges
7. `getMembers()` - 56 edges
8. `isCentreHead()` - 52 edges
9. `getEvents()` - 51 edges
10. `serverPatch()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `Vercel Deployment Plan` --semantically_similar_to--> `Self-Hosted Deployment (Hostinger KVM VPS)`  [INFERRED] [semantically similar]
  PROJECT DOCS/04-TechSpec-LEADSDashboard.md → README.md
- `Deployment Note: Single TrueNAS Instance` --semantically_similar_to--> `Self-Hosted Deployment (Hostinger KVM VPS)`  [INFERRED] [semantically similar]
  docs/changes-needed-for-claude.md → README.md
- `Tasks Desk Module` --semantically_similar_to--> `Task Management Module (PRD)`  [INFERRED] [semantically similar]
  README.md → PROJECT DOCS/01-PRD-LEADSDashboard.md
- `Dual-Level Reimbursement Pipeline (Demo)` --semantically_similar_to--> `Reimbursements System Module`  [INFERRED] [semantically similar]
  demo/index.html → README.md
- `Row-Level Security Access Control` --semantically_similar_to--> `Tier-Based Access Control`  [INFERRED] [semantically similar]
  PROJECT DOCS/04-TechSpec-LEADSDashboard.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Backend Sync Reliability Fixes** — docs_bugs_to_fix_write_mutex_permanently_breaks, docs_bugs_to_fix_cross_device_polling_never_updates, docs_bugs_to_fix_committee_tasks_invisible, docs_changes_needed_for_claude_backend_sync_spec [INFERRED 0.85]
- **Proposed-to-Actual Tech Stack Evolution** — project_docs_01_prd_leadsdashboard_leads_all_in_one_dashboard, project_docs_04_techspec_leadsdashboard_recommended_stack, readme_tech_stack [INFERRED 0.75]
- **Access Tier System Evolution (6-Tier Plan to 7-Tier Actual)** — project_docs_01_prd_leadsdashboard_role_tier_system, readme_access_tiers_matrix, project_docs_leadsarchitecture_access_tiers [INFERRED 0.80]

## Communities (134 total, 62 thin omitted)

### Community 0 - "Dashboard Shell & Layout"
Cohesion: 0.06
Nodes (105): allSidebarItems, DashboardShell(), loadSeenActionIds(), NavSection, navSections, saveSeenActionIds(), SidebarItem, NotFoundScreen() (+97 more)

### Community 1 - "Approval Requests & Auth Email"
Cohesion: 0.06
Nodes (54): RFC-5321, POST(), POST(), POST(), register(), ActivationToken, getAppBaseUrl(), BirthdayEmailLogEntry (+46 more)

### Community 2 - "Access Level & Approval APIs"
Cohesion: 0.10
Nodes (48): GET(), POST(), GET(), DELETE(), PATCH(), GET(), GET(), POST() (+40 more)

### Community 3 - "Calendar/Home/Ratings Pages"
Cohesion: 0.08
Nodes (49): CalendarPage(), DashboardHome(), isDesignTask(), RatingsPage(), ReportsPage(), PeriodFilter(), PeriodFilterProps, StudentProfileModal() (+41 more)

### Community 4 - "Budget/Income/Design APIs"
Cohesion: 0.08
Nodes (51): DELETE(), PATCH(), DELETE(), canManageIncomeSources(), DELETE(), PATCH(), canManageIncomeSources(), POST() (+43 more)

### Community 5 - "Group Policies & Submissions"
Cohesion: 0.05
Nodes (52): Group Policies, Per-Collection Async Write Mutex, Write Mutex Permanently Breaks After First Error, GET(), NOTE: intentionally NOT gated with requireSession. The Forms dashboard, buildDefaultTokens(), escapeXml(), FIELD_FILL_MAP (+44 more)

### Community 6 - "Data Collections Overview"
Cohesion: 0.07
Nodes (51): CLAUDE.md (Root Architecture Guide), accessLevelSettings Collection, accountActivations Collection, announcements Collection, auditLogs Collection, birthdayEmailLog Collection, budgets Collection, designs Collection (+43 more)

### Community 7 - "Directory & Guest Pages"
Cohesion: 0.12
Nodes (46): DirectoryPage(), emptyForm, GuestDirectoryPage(), applyMailMerge(), Guest, GuestInvitesPage(), useDropTarget(), downloadCsv() (+38 more)

### Community 8 - "OCR Spellcheck"
Cohesion: 0.08
Nodes (39): OcrScanIssue, OcrScanPageImage, OcrScanResult, cleanWord(), getSpellCheckerUK(), getSpellCheckerUS(), getWorker(), INDIAN_ENGLISH_WHITELIST (+31 more)

### Community 9 - "Announcements & Event Reports API"
Cohesion: 0.11
Nodes (35): DELETE(), PATCH(), POST(), maxDuration, POST(), DELETE(), PATCH(), PENDING_APPROVAL_MESSAGE (+27 more)

### Community 10 - "Forms Page Charts"
Cohesion: 0.11
Nodes (38): buildCategoryChartData(), buildFieldCounts(), buildScaleChartData(), buildSubmissionsByDay(), CHART_COLORS, CHARTABLE_TYPES, chartCountDomainMax(), computeAverage() (+30 more)

### Community 11 - "Designs/Festivals/Tasks Pages"
Cohesion: 0.17
Nodes (35): DesignPortalPage(), FestivalsPage(), TasksPage(), DelegateTaskModal(), DelegateTaskModalProps, addDesign(), addTask(), approveTask() (+27 more)

### Community 12 - "Backup/Reports/Settings Pages"
Cohesion: 0.12
Nodes (33): BackupRestorePage(), EventReportsPage(), SettingsPage(), createProgressTracker(), FileDropzone(), FileDropzoneProps, FilePreviewRow(), FilePreviewRowProps (+25 more)

### Community 13 - "Designs & Event Reports API"
Cohesion: 0.12
Nodes (28): PATCH(), maxDuration, POST(), DELETE(), isEventReportAuthor(), PATCH(), GET(), NOTE: intentionally NOT gated with requireSession. Every avatar/attachment (+20 more)

### Community 14 - "Auth Activation & Login API"
Cohesion: 0.14
Nodes (22): GET(), POST(), POST(), POST(), POST(), POST(), POST(), POST() (+14 more)

### Community 15 - "Login & Setup Pages"
Cohesion: 0.09
Nodes (25): INSPIRATIONAL_QUOTES, LoginPage(), QuoteItem, SetupPage(), IosInstallPrompt(), isIos(), isStandalone(), LoadingScreen() (+17 more)

### Community 16 - "Deployment & Email Setup Guides"
Cohesion: 0.09
Nodes (29): Direct Send SMTP Setup, DKIM/SPF/DMARC DNS Configuration, Full DNS Rebuild & Mail Verification, Super User Setup Process, PM2/Nginx/Certbot Bootstrap, VPS Setup Bootstrap Procedure, log(), vps-setup.sh script (+21 more)

### Community 17 - "Events Pages & Local Data"
Cohesion: 0.24
Nodes (28): EventDetailPage(), EventsPage(), EventStatusFilter, addEvent(), addEventCommittee(), approveEvent(), approveEventCommittee(), deleteEvent() (+20 more)

### Community 18 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 19 - "Finance Module Diagram (docs)"
Cohesion: 0.09
Nodes (27): Allocation Data (input), 1.0 Annual Budget Allocation, 1.1 Budget Module (Stores & Manages Allocation), 3.1 Claim Validation (Syntax Checks), 8.0 Financial Reporting, Funding Available? (Decision), Funding Denied (Holds Claim, Notifies Finance), Grants (input) (+19 more)

### Community 20 - "Budget Page UI"
Cohesion: 0.14
Nodes (26): BudgetPage(), CATEGORY_OPTIONS, CHART_COLORS, CURRENT_FY, CURRENT_FY_START, FINANCIAL_YEARS, MONTH_NAMES, addBudget() (+18 more)

### Community 21 - "Finance Module Diagram (dashboard docs)"
Cohesion: 0.09
Nodes (26): Allocation Data (input), 1.0 Annual Budget Allocation, 1.1 Budget Module (Stores & Manages Allocation), 3.1 Claim Validation (Syntax Checks), 8.0 Financial Reporting, Funding Available? (decision), Funding Denied (Holds Claim, Notifies Finance), Grants (input) (+18 more)

### Community 22 - "ESLint & Dev Dependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/adm-zip (+17 more)

### Community 23 - "Group Policies Page"
Cohesion: 0.12
Nodes (23): ALL_DIVISIONS, ALL_TIERS, EVERYONE_ELSE_RULE, GroupPoliciesPage(), memberMatchesCriteria(), ModuleAccessGrant, ModuleAccessMap, slugifyTag() (+15 more)

### Community 24 - "Zip/Archive Dependencies"
Cohesion: 0.09
Nodes (23): adm-zip, archiver, jspdf-autotable, jszip, dependencies, adm-zip, archiver, dictionary-en-gb (+15 more)

### Community 25 - "Encryption Utilities"
Cohesion: 0.19
Nodes (22): decryptData(), deriveKey(), encryptData(), EncryptedPayload, FIXED_SALT, getMasterKey(), isEncryptedPayload(), collectionPath() (+14 more)

### Community 26 - "Form Templates & OCR Scan API"
Cohesion: 0.17
Nodes (15): POST(), DELETE(), GET(), POST(), DELETE(), PATCH(), maxDuration, POST() (+7 more)

### Community 27 - "Announcements & Email Pages"
Cohesion: 0.18
Nodes (19): AnnouncementsPage(), EmailManagementPage(), PendingQueueItem, ConfirmModal(), ConfirmModalProps, EmptyState(), EmailLog, EmailSettings (+11 more)

### Community 28 - "Designs & Forms Module Diagram (docs)"
Cohesion: 0.18
Nodes (21): AI-Powered OCR Scan & Data Extraction, Answer Ingestion & Data Capture, Asset Intake & Validation (section), Auto-Complete Linked Tasks & Requirements, Combined Gates Pass Decision, Data Processing & Document Generation (section), Design Asset Upload, DOCX Document Generated & Stored (+13 more)

### Community 29 - "Student Core Council Roster"
Cohesion: 0.10
Nodes (21): Aravind Manashetti - Head Finance and Sponsorship, Jyotsna Karn - Chief Coordinator, Kayomarz M Pavri - Head Design and Social Media, Kishan KP - Head Marketing and Branding, Kunal Bhadauria - Vice President, LEADS Next Gen Centre (RUAS), Manoj Petakamsetty - General Secretary, Nimisha K M - Head Sustainability and Innovation (+13 more)

### Community 30 - "Designs & Forms Module Diagram (dashboard docs)"
Cohesion: 0.18
Nodes (18): AI-Powered OCR Scan & Data Extraction, Answer Ingestion & Data Capture, Asset Intake & Validation (subprocess), Auto-Complete Linked Tasks & Requirements, Data Processing & Document Generation (subprocess), Design Asset Upload, DOCX Document Generated & Stored, External Source (+10 more)

### Community 31 - "Backup & Restore"
Cohesion: 0.24
Nodes (13): POST(), POST(), BackupSummary, buildZipBuffer(), createEncryptedBackup(), DATA_DIR, decryptBackup(), deriveKey() (+5 more)

### Community 32 - "Email Logs & Queue API"
Cohesion: 0.25
Nodes (13): GET(), DELETE(), GET(), POST(), GET(), POST(), POST(), canManageEmailSettings() (+5 more)

### Community 33 - "Members Bulk & ID API"
Cohesion: 0.33
Nodes (13): DELETE(), PATCH(), POST(), DELETE(), PATCH(), POST(), createActivationTokenAndSendEmail(), countActiveSuperUsersServer() (+5 more)

### Community 34 - "Sync Status Component"
Cohesion: 0.26
Nodes (13): SyncStatusPill(), beginSync(), dismissSyncEntry(), entries, getSyncEntries(), getSyncSuccessFlash(), listeners, notify() (+5 more)

### Community 35 - "Approvals Page"
Cohesion: 0.26
Nodes (13): ApprovalsPage(), entityIcon(), entityLink(), statusBadge(), Tab, RequestApprovalModal(), RequestApprovalModalProps, ApprovalRequest (+5 more)

### Community 36 - "PRD Modules Overview"
Cohesion: 0.14
Nodes (15): Announcements & Email Alerts Module (PRD), LEADS All-in-One Dashboard (Product), Member & Committee Directory Module (PRD), Reimbursement Portal Module (PRD), Task Management Module (PRD), Dashboard Route Tree, Announcements Copy, Reimbursement Module Copy (+7 more)

### Community 37 - "Holiday Scheduler (iCal)"
Cohesion: 0.27
Nodes (13): RFC-5545, addDaysDateString(), msUntilNextSunday(), ParsedHoliday, parseIcsDate(), parseIcsHolidays(), runHolidayApprovalTasks(), runHolidaySync() (+5 more)

### Community 38 - "Promotion Modal & UI Buttons"
Cohesion: 0.15
Nodes (12): PromotionData, PromotionModal(), PromotionModalProps, Button(), Chip(), ChipColor, ChipProps, ChipSize (+4 more)

### Community 39 - "Tier-Based Access Control"
Cohesion: 0.15
Nodes (13): Tier-Based Access Control, Reimbursement Approval Stage Not Enforced by Role, Bank Account Details Rendered Unmasked, Two-Stage Reimbursement Approval Not Implemented, Permission Hierarchy & RBAC (leads-dashboard/README.md), 6-Tier Role System (PRD), Security & Access Control (PRD), Access Matrix by Route Group (+5 more)

### Community 40 - "Reimbursement Pipeline & Bugs"
Cohesion: 0.17
Nodes (13): Dual-Level Reimbursement Pipeline (Demo), LEADS ERP Interactive Prototype, Member Performance & Evaluation (Demo), Task Traceability Matrix (Demo), Committee-Assigned Tasks Invisible to Everyone, Duplicated Permission Logic Across Screens, Rating & Evaluation Module (PRD), Rating Module Copy (+5 more)

### Community 41 - "Database ER Diagram (docs)"
Cohesion: 0.31
Nodes (13): Announcement table, Budget table, Design table, Event table, GroupPolicy table, Guest table, Member table, PublicForm table (+5 more)

### Community 42 - "Database ER Diagram (dashboard docs)"
Cohesion: 0.26
Nodes (13): Announcement, Budget, Design, Event, GroupPolicy, Guest, Member, PublicForm (+5 more)

### Community 43 - "Avatar Component"
Cohesion: 0.15
Nodes (9): Avatar(), AvatarColor, AvatarContext, AvatarContextValue, AvatarFallbackProps, AvatarGroupProps, AvatarImageProps, AvatarProps (+1 more)

### Community 44 - "Card Component"
Cohesion: 0.18
Nodes (7): CardBodyProps, CardFooterProps, CardHeaderProps, CardProps, createParticleElement(), ParticleCard(), ParticleCardProps

### Community 45 - "API Layer & Sync Bugs"
Cohesion: 0.17
Nodes (12): REST API Layer (One Folder Per Collection), Flat JSON File Database, Cross-Device Polling Never Actually Updates Open Screen, Backend Sync Fix Implementation Spec, Deployment Note: Single TrueNAS Instance, Fix Load Race: Server Data Must Win Over Seed Data, Add Live Sync Between Open Sessions (Polling), Split Into Per-Collection Per-Record API Routes (+4 more)

### Community 46 - "Student Advisory Council Slide"
Cohesion: 0.20
Nodes (12): Abhijit Arya (Senior Vice President), Arvind Rakshith (Senior Head, Finance and Sponsorship), Bharvi A Padia (Senior Head, Public Relations), Bhawen Maroo (Senior Head, Events and Operations), Gurutejas C (Senior President), LEADS Next Gen Centre Student Council - Student Advisory Council Slide, Laksh Soorya Singh (Senior Head, Events and Operations), LEADS Next Gen Centre - RUAS (+4 more)

### Community 47 - "Org Structure Chart"
Cohesion: 0.30
Nodes (12): Centre Head, Chief-Advisor (Dean, FMC), Event Head, GG Campus, Event Head, RTC Campus, Head, Finance & Auditor, Head, Industry Connect, LEADS Next Gen Centre, RUAS, LEADS Next Gen Centre Organization Structure Chart (+4 more)

### Community 48 - "Known Bugs Tracker"
Cohesion: 0.18
Nodes (11): Audit Log Unbounded on Client, Capped Inconsistently on Server, Settings Change Password Is Fully Decorative, Dead Un-Mutex'd Write Path in /api/data, LEADS Dashboard Full Codebase Bug Audit, Public Form Slugs Not Checked for Uniqueness Server-Side, Test-Persona Tiers Contradict App's Own Role/Tier Table, Module Breakdown (leads-dashboard/README.md), Settings Module (Actual Flow) (+3 more)

### Community 49 - "Module Data Flow Diagram (docs)"
Cohesion: 0.33
Nodes (11): Announcements Engine, Budget & Funds, Design Portal, Dynamic Group Policies, Events Desk, Executive Reports, Guest Directory, Public Forms (+3 more)

### Community 50 - "Events & Tasks Module Diagram (docs)"
Cohesion: 0.25
Nodes (11): All Required Tasks Complete? (decision), 2. Committee Rosters Module, 5. Completion Triggers Module, 4. Deliverable Tracking Module, End: Event Concluded, 1. Event Creation Module, Events and Tasks Management Subsystem (Main Module), Reject/Correct Request (+3 more)

### Community 51 - "Module Data Flow Diagram (dashboard docs)"
Cohesion: 0.35
Nodes (11): Announcements Engine, Budget & Funds, Design Portal, Dynamic Group Policies, Events Desk, Executive Reports, Guest Directory, Public Forms (+3 more)

### Community 52 - "Events & Tasks Module Diagram (dashboard docs)"
Cohesion: 0.25
Nodes (11): All Required Tasks Complete? (decision), 2. Committee Rosters Module, 5. Completion Triggers Module, 4. Deliverable Tracking Module, End: Event Concluded, 1. Event Creation Module, Events and Tasks Management Subsystem (Main Module), Reject/Correct Request (+3 more)

### Community 53 - "Tech Stack & Design System"
Cohesion: 0.18
Nodes (11): Student Roster & Committee Reference Images, Color Palette, Vercel Deployment Plan, Recommended Stack (Next.js/Supabase/Vercel), LEADS Next Gen All-in-One Dashboard README, Tech Stack (Actual), Faculty & Institutional Leadership, Kayomarz M Pavri (+3 more)

### Community 54 - "Root Layout & Fonts"
Cohesion: 0.24
Nodes (7): geistMono, geistSans, metadata, HapticFeedbackProvider(), HapticPattern, PATTERNS, triggerHaptic()

### Community 55 - "Package Scripts"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, setup, start (+1 more)

### Community 56 - "UI Components (Empty State/Ripple)"
Cohesion: 0.24
Nodes (5): EmptyStateProps, Ripple, RippleButton, RippleButtonProps, SkeletonProps

### Community 57 - "Leadership Team Slide"
Cohesion: 0.36
Nodes (10): Dr. Ajay R (Finance Head and Auditor), Dr. Kiran Kumar B M (Head Events, RTC), Dr. K. M. Sharath Kumar (Chief Advisor), Dr. Kuldeep Kumar Raina (Patron), LEADS Next Gen Centre Leadership Slide (Page 4), LEADS Next Gen Centre, Dr. Pallabi Mund (Head Events, GG), Ramaiah University of Applied Sciences (RUAS) (+2 more)

### Community 58 - "Reimbursements Page & Local Data"
Cohesion: 0.57
Nodes (7): ReimbursementsPage(), addReimbursement(), getReimbursements(), ReceiptFile, saveReimbursements(), updateReimbursementStatus(), verifyReimbursementByCentreHead()

### Community 59 - "Button Component"
Cohesion: 0.25
Nodes (7): ButtonColor, ButtonProps, ButtonSize, ButtonVariant, COLOR_VARIANTS, Ripple, SIZES

### Community 60 - "Student Advisory Council (dup slide)"
Cohesion: 0.25
Nodes (8): Abhijit Arya - Senior Vice President, Arvind Rakshith - Senior Head, Finance and Sponsorship, Bharvi A Padia - Senior Head, Public Relations, Bhawen Maroo - Senior Head, Events and Operations, Gurutejas C - Senior President, Laksh Soorya Singh - Senior Head, Events and Operations, LEADS Next Gen Centre - Student Advisory Council Slide, Shreesha S N - Senior Head, Design and Social Media

### Community 61 - "Public Form Builder Module"
Cohesion: 0.29
Nodes (7): Dynamic Public Form Builder & QR Codes (Demo), Public Form Builder Module (PRD), Public /forms/[slug] Route Group, Public Form Module Copy, Tone Guidelines, Forms & Public Submissions Module (Actual Flow), Public Forms Builder Module

### Community 62 - "Recommended Fixes & Design System"
Cohesion: 0.29
Nodes (7): LEADS All-in-One Dashboard Full System Review, Bar Chart Colors Hardcoded, Not Rating-Scale Driven, Logout Doesn't Clear Session, No PDF Export Exists (Only CSV), Rating Color Scale, Chart Requirements, PDF/CSV Export

### Community 63 - "Progress Component"
Cohesion: 0.29
Nodes (5): COLOR_TRACKS, ProgressColor, ProgressProps, ProgressSize, SIZES

### Community 64 - "Reports & Analytics Module"
Cohesion: 0.33
Nodes (6): Institutional Reports & Analytics (Demo), Reports & Analytics Module (PRD), Reports Module Copy, Report Types (By Event/Committee/Individual), Reports Module (Actual Flow), Analytics & Reports Module

### Community 65 - "Event Management Module"
Cohesion: 0.40
Nodes (5): Event Proposals & Orchestration (Demo), getCommittees() Fallback List Doesn't Reflect Per-Event Model, Event Management Module (PRD), Events Module (Actual Flow), Events Desk Module

### Community 66 - "Backup Decryption Script"
Cohesion: 0.40
Nodes (4): crypto, fs, path, resolvedPath

### Community 67 - "Manual DOCX Generator Script"
Cohesion: 0.83
Nodes (3): create_manual(), set_cell_background(), set_cell_margins()

## Ambiguous Edges - Review These
- `Member table` → `Guest table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Reimbursement table` → `Design table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Task table` → `Rating table (event-linked)`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Task table` → `Rating table (form-linked)`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Submission table` → `GroupPolicy table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Guest table` → `Design table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Rating table (event-linked)` → `Announcement table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Announcement table` → `GroupPolicy table`  [AMBIGUOUS]
  docs/database_er_diagram.png · relation: conceptually_related_to
- `Member` → `Guest`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: references
- `Task` → `Rating (lower, member/event score)`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: references
- `Rating (upper, form-linked)` → `Rating (lower, member/event score)`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: conceptually_related_to
- `Submission` → `GroupPolicy`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: references
- `Budget & Funds` → `Ratings & Performance`  [AMBIGUOUS]
  leads-dashboard/docs/module_data_flow_diagram.png · relation: shares_data_with
- `Ratings & Performance` → `Dynamic Group Policies`  [AMBIGUOUS]
  leads-dashboard/docs/module_data_flow_diagram.png · relation: shares_data_with

## Knowledge Gaps
- **417 isolated node(s):** `deploy.sh script`, `eslintConfig`, `nextConfig`, `name`, `version` (+412 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 466 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Member table` and `Guest table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Reimbursement table` and `Design table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Task table` and `Rating table (event-linked)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Task table` and `Rating table (form-linked)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Submission table` and `GroupPolicy table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Guest table` and `Design table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Rating table (event-linked)` and `Announcement table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._