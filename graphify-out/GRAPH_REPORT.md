# Graph Report - ERP  (2026-09-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1609 nodes · 5142 edges · 121 communities (68 shown, 52 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd61603f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- local-data.ts
- rate-limit.ts
- apiError
- getMembers
- CLAUDE.md (Root Architecture Guide)
- permissions-server.ts
- logAuditEvent
- requireSession
- tasks/page.tsx
- ratings/page.tsx
- forms/page.tsx
- readCollectionFile
- file-storage.ts
- getAccessLevelSettingsServer
- app/page.tsx
- setup-superuser.js
- permissions.ts
- dashboard-shell.tsx
- mutateCollection
- visiting-card-ocr.ts
- compilerOptions
- 3.0 Reimbursement Claim Submission
- Asset Intake & Validation (section)
- budget/page.tsx
- reimbursements/page.tsx
- policies/page.tsx
- Member
- devDependencies
- members/[id]/route.ts
- email-service.ts
- hasCapability
- dependencies
- LEADS All-in-One Dashboard Full System Review
- isCentreHead
- LEADS All-in-One Dashboard (Product)
- sync-status.ts
- backup.ts
- announcements/page.tsx
- approvals/page.tsx
- LEADS Dashboard Full Codebase Bug Audit
- holiday-scheduler.ts
- event-reports/page.tsx
- chip.tsx
- birthday-scheduler.ts
- LEADS ERP Interactive Prototype
- Member table
- avatar.tsx
- card.tsx
- direct-smtp-transport.ts
- Reimbursements Module (Actual Flow)
- Events and Tasks Management Subsystem (Main Module)
- dispatchEmail
- app/layout.tsx
- task-email-queue.ts
- package.json
- empty-state.tsx
- Reports & Analytics Module (PRD)
- button.tsx
- Security & Encryption Strategy
- progress.tsx
- Member
- approval-sync.ts
- matchingModulePolicies
- Organisation Hierarchy
- decrypt-backup.js
- request-email-change/route.ts
- Member & Committee Directory Module (PRD)
- generate_manual_docx.py
- adm-zip
- Deployment Workflow (Standing Instruction)
- deploy.sh
- dictionary-en
- html2canvas
- jspdf
- jszip
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- lucide-react
- @napi-rs/canvas
- nspell
- ogl
- react
- tesseract.js
- @types/qrcode
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
- LEADS Next Gen Centre - RUAS Short Logo
- Light Mode Background Image
- Next.js Logo (next.svg)
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

## Communities (121 total, 52 thin omitted)

### Community 0 - "local-data.ts"
Cohesion: 0.05
Nodes (65): Group Policies, Per-Collection Async Write Mutex, Write Mutex Permanently Breaks After First Error, GET(), NOTE: intentionally NOT gated with requireSession. The Forms dashboard, SettingsPage(), PublicFormPage(), useUploadTask() (+57 more)

### Community 1 - "rate-limit.ts"
Cohesion: 0.07
Nodes (56): ActivateAccountSchema, GET(), POST(), ChangePasswordSchema, POST(), ConfirmEmailChangeSchema, POST(), ConfirmNewEmailSchema (+48 more)

### Community 2 - "apiError"
Cohesion: 0.10
Nodes (40): GET(), POST(), DELETE(), PATCH(), GET(), POST(), GET(), POST() (+32 more)

### Community 3 - "getMembers"
Cohesion: 0.11
Nodes (49): DirectoryPage(), emptyForm, GuestDirectoryPage(), applyMailMerge(), Guest, GuestInvitesPage(), EmptyState(), useDropTarget() (+41 more)

### Community 4 - "CLAUDE.md (Root Architecture Guide)"
Cohesion: 0.07
Nodes (51): CLAUDE.md (Root Architecture Guide), accessLevelSettings Collection, accountActivations Collection, announcements Collection, auditLogs Collection, birthdayEmailLog Collection, budgets Collection, designs Collection (+43 more)

### Community 5 - "permissions-server.ts"
Cohesion: 0.09
Nodes (47): DELETE(), PATCH(), canManageIncomeSources(), DELETE(), PATCH(), PATCH(), AccessLevelSettings, anyKeywordMatches() (+39 more)

### Community 6 - "logAuditEvent"
Cohesion: 0.15
Nodes (42): CalendarPage(), EventDetailPage(), EventsPage(), EventStatusFilter, DashboardHome(), StudentProfileModal(), StudentProfileModalProps, addEvent() (+34 more)

### Community 7 - "requireSession"
Cohesion: 0.11
Nodes (29): GET(), POST(), POST(), POST(), GET(), GET(), DELETE(), GET() (+21 more)

### Community 8 - "tasks/page.tsx"
Cohesion: 0.17
Nodes (35): DesignPortalPage(), FestivalsPage(), TasksPage(), DelegateTaskModal(), DelegateTaskModalProps, addDesign(), addTask(), approveTask() (+27 more)

### Community 9 - "ratings/page.tsx"
Cohesion: 0.12
Nodes (34): isDesignTask(), RatingsPage(), ReportsPage(), PeriodFilter(), PeriodFilterProps, getRatingColor(), addRating(), deleteRating() (+26 more)

### Community 10 - "forms/page.tsx"
Cohesion: 0.13
Nodes (35): buildCategoryChartData(), buildFieldCounts(), buildScaleChartData(), buildSubmissionsByDay(), CHART_COLORS, CHARTABLE_TYPES, chartCountDomainMax(), computeAverage() (+27 more)

### Community 11 - "readCollectionFile"
Cohesion: 0.10
Nodes (34): decryptData(), deriveKey(), encryptData(), EncryptedPayload, FIXED_SALT, getMasterKey(), isEncryptedPayload(), OcrScanIssue (+26 more)

### Community 12 - "file-storage.ts"
Cohesion: 0.13
Nodes (28): DELETE(), PATCH(), POST(), DELETE(), isEventReportAuthor(), PATCH(), GET(), NOTE: intentionally NOT gated with requireSession. Every avatar/attachment (+20 more)

### Community 13 - "getAccessLevelSettingsServer"
Cohesion: 0.16
Nodes (23): DELETE(), PATCH(), GET(), POST(), DELETE(), GET(), POST(), DELETE() (+15 more)

### Community 14 - "app/page.tsx"
Cohesion: 0.09
Nodes (25): INSPIRATIONAL_QUOTES, LoginPage(), QuoteItem, SetupPage(), IosInstallPrompt(), isIos(), isStandalone(), LoadingScreen() (+17 more)

### Community 15 - "setup-superuser.js"
Cohesion: 0.09
Nodes (29): Direct Send SMTP Setup, DKIM/SPF/DMARC DNS Configuration, Full DNS Rebuild & Mail Verification, Super User Setup Process, PM2/Nginx/Certbot Bootstrap, VPS Setup Bootstrap Procedure, log(), vps-setup.sh script (+21 more)

### Community 16 - "permissions.ts"
Cohesion: 0.16
Nodes (30): getAccessLevelSettings(), anyKeywordMatches(), canCreateAnnouncement(), canCreateEvent(), canCreateTask(), canDecideTaskExtension(), canDeleteTask(), canEditEvent() (+22 more)

### Community 17 - "dashboard-shell.tsx"
Cohesion: 0.11
Nodes (22): allSidebarItems, DashboardShell(), loadSeenActionIds(), NavSection, navSections, saveSeenActionIds(), SidebarItem, NotFoundScreen() (+14 more)

### Community 18 - "mutateCollection"
Cohesion: 0.14
Nodes (24): maxDuration, POST(), POST(), DELETE(), PATCH(), PENDING_APPROVAL_MESSAGE, PENDING_STATES, GET() (+16 more)

### Community 19 - "visiting-card-ocr.ts"
Cohesion: 0.13
Nodes (28): ADDRESS_KEYWORDS, cleanOcrLine(), convertPdfToImageBuffers(), DEPARTMENT_MARKERS, DESIGNATION_KEYWORDS, execFileAsync, ExtractedCardDetails, getWorker() (+20 more)

### Community 20 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 21 - "3.0 Reimbursement Claim Submission"
Cohesion: 0.09
Nodes (28): Allocation Data (input), 1.0 Annual Budget Allocation, 1.1 Budget Module (Stores & Manages Allocation), 3.1 Claim Validation (Syntax Checks), 8.0 Financial Reporting, Funding Available? (Decision), Funding Denied (Holds Claim, Notifies Finance), Grants (input) (+20 more)

### Community 22 - "Asset Intake & Validation (section)"
Cohesion: 0.16
Nodes (26): AI-Powered OCR Scan & Data Extraction, Answer Ingestion & Data Capture, Asset Intake & Validation (section), Auto-Complete Linked Tasks & Requirements, Combined Gates Pass Decision, Data Processing & Document Generation (section), Design Asset Upload, DOCX Document Generated & Stored (+18 more)

### Community 23 - "budget/page.tsx"
Cohesion: 0.15
Nodes (24): BudgetPage(), CATEGORY_OPTIONS, CHART_COLORS, CURRENT_FY, CURRENT_FY_START, FINANCIAL_YEARS, MONTH_NAMES, addBudget() (+16 more)

### Community 24 - "reimbursements/page.tsx"
Cohesion: 0.18
Nodes (21): BackupRestorePage(), ReimbursementsPage(), createProgressTracker(), FileDropzone(), FileDropzoneProps, FilePreviewRow(), FilePreviewRowProps, formatEta() (+13 more)

### Community 25 - "policies/page.tsx"
Cohesion: 0.13
Nodes (23): ALL_DIVISIONS, ALL_TIERS, EVERYONE_ELSE_RULE, GroupPoliciesPage(), memberMatchesCriteria(), ModuleAccessGrant, ModuleAccessMap, slugifyTag() (+15 more)

### Community 26 - "Member"
Cohesion: 0.16
Nodes (23): Announcements Engine, Budget & Funds, Design Portal, Dynamic Group Policies, Events Desk, Executive Reports, Guest Directory, Public Forms (+15 more)

### Community 27 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/adm-zip (+15 more)

### Community 28 - "members/[id]/route.ts"
Cohesion: 0.21
Nodes (18): DELETE(), PATCH(), POST(), POST(), DELETE(), PATCH(), GET(), MemberCreateSchema (+10 more)

### Community 29 - "email-service.ts"
Cohesion: 0.14
Nodes (20): EmailManagementPage(), PendingQueueItem, ApprovalRecipients, DEFAULT_EMAIL_SETTINGS, EMAIL_LOGO_ATTACHMENT, EmailLog, EmailSettings, escapeHtmlForTitle() (+12 more)

### Community 30 - "hasCapability"
Cohesion: 0.20
Nodes (22): canAddMember(), canApproveAsSectorHead(), canBuildForms(), canDeleteForms(), canEditDirectory(), canEditMemberRecordRow(), canEditRating(), canManageEmailSettings() (+14 more)

### Community 31 - "dependencies"
Cohesion: 0.10
Nodes (21): dictionary-en-gb, gsap, isomorphic-dompurify, jspdf-autotable, dependencies, dictionary-en-gb, gsap, isomorphic-dompurify (+13 more)

### Community 32 - "LEADS All-in-One Dashboard Full System Review"
Cohesion: 0.11
Nodes (19): REST API Layer (One Folder Per Collection), Flat JSON File Database, Cross-Device Polling Never Actually Updates Open Screen, Backend Sync Fix Implementation Spec, Deployment Note: Single TrueNAS Instance, Fix Load Race: Server Data Must Win Over Seed Data, Add Live Sync Between Open Sessions (Polling), Split Into Per-Collection Per-Record API Routes (+11 more)

### Community 33 - "isCentreHead"
Cohesion: 0.20
Nodes (19): isTaskAssignee(), canApproveAnnouncement(), canApprovePendingForm(), canApprovePendingTask(), canChangeTaskStatus(), canEvaluateEventStudent(), canRespondToHolidayApproval(), canReviewDesignProofread() (+11 more)

### Community 34 - "LEADS All-in-One Dashboard (Product)"
Cohesion: 0.13
Nodes (18): Announcements & Email Alerts Module (PRD), LEADS All-in-One Dashboard (Product), Reimbursement Portal Module (PRD), Task Management Module (PRD), Dashboard Route Tree, Public /forms/[slug] Route Group, Color Palette, Announcements Copy (+10 more)

### Community 35 - "sync-status.ts"
Cohesion: 0.26
Nodes (13): SyncStatusPill(), beginSync(), dismissSyncEntry(), entries, getSyncEntries(), getSyncSuccessFlash(), listeners, notify() (+5 more)

### Community 36 - "backup.ts"
Cohesion: 0.25
Nodes (12): POST(), BackupSummary, buildZipBuffer(), createEncryptedBackup(), DATA_DIR, decryptBackup(), deriveKey(), InvalidPassphraseError (+4 more)

### Community 37 - "announcements/page.tsx"
Cohesion: 0.30
Nodes (13): AnnouncementsPage(), ConfirmModal(), ConfirmModalProps, addAnnouncement(), AnnouncementItem, approveAnnouncement(), deleteAnnouncement(), getAnnouncements() (+5 more)

### Community 38 - "approvals/page.tsx"
Cohesion: 0.26
Nodes (13): ApprovalsPage(), entityIcon(), entityLink(), statusBadge(), Tab, RequestApprovalModal(), RequestApprovalModalProps, ApprovalRequest (+5 more)

### Community 39 - "LEADS Dashboard Full Codebase Bug Audit"
Cohesion: 0.14
Nodes (14): Event Proposals & Orchestration (Demo), Audit Log Unbounded on Client, Capped Inconsistently on Server, Settings Change Password Is Fully Decorative, Dead Un-Mutex'd Write Path in /api/data, getCommittees() Fallback List Doesn't Reflect Per-Event Model, LEADS Dashboard Full Codebase Bug Audit, Public Form Slugs Not Checked for Uniqueness Server-Side, Test-Persona Tiers Contradict App's Own Role/Tier Table (+6 more)

### Community 40 - "holiday-scheduler.ts"
Cohesion: 0.27
Nodes (13): RFC-5545, addDaysDateString(), msUntilNextSunday(), ParsedHoliday, parseIcsDate(), parseIcsHolidays(), runHolidayApprovalTasks(), runHolidaySync() (+5 more)

### Community 41 - "event-reports/page.tsx"
Cohesion: 0.36
Nodes (13): EventReportsPage(), addEventReport(), approveEventReport(), deleteEventReport(), EventReportItem, getEventReports(), rejectEventReport(), resubmitEventReport() (+5 more)

### Community 42 - "chip.tsx"
Cohesion: 0.15
Nodes (12): PromotionData, PromotionModal(), PromotionModalProps, Button(), Chip(), ChipColor, ChipProps, ChipSize (+4 more)

### Community 43 - "birthday-scheduler.ts"
Cohesion: 0.24
Nodes (11): register(), BirthdayEmailLogEntry, monthDay(), msUntilNextMidnight(), runBirthdayCheck(), startBirthdayScheduler(), todayDateString(), msUntilNextMidnight() (+3 more)

### Community 44 - "LEADS ERP Interactive Prototype"
Cohesion: 0.17
Nodes (13): Dynamic Public Form Builder & QR Codes (Demo), LEADS ERP Interactive Prototype, Member Performance & Evaluation (Demo), Task Traceability Matrix (Demo), Committee-Assigned Tasks Invisible to Everyone, Duplicated Permission Logic Across Screens, Rating & Evaluation Module (PRD), Rating Module Copy (+5 more)

### Community 45 - "Member table"
Cohesion: 0.31
Nodes (13): Announcement table, Budget table, Design table, Event table, GroupPolicy table, Guest table, Member table, PublicForm table (+5 more)

### Community 46 - "avatar.tsx"
Cohesion: 0.15
Nodes (9): Avatar(), AvatarColor, AvatarContext, AvatarContextValue, AvatarFallbackProps, AvatarGroupProps, AvatarImageProps, AvatarProps (+1 more)

### Community 47 - "card.tsx"
Cohesion: 0.18
Nodes (7): CardBodyProps, CardFooterProps, CardHeaderProps, CardProps, createParticleElement(), ParticleCard(), ParticleCardProps

### Community 48 - "direct-smtp-transport.ts"
Cohesion: 0.26
Nodes (8): RFC-5321, deliverToHost(), DeliveryResult, DirectSendTransport, DirectSendTransportOptions, groupRecipientsByDomain(), resolveMxHosts(), streamToBuffer()

### Community 49 - "Reimbursements Module (Actual Flow)"
Cohesion: 0.18
Nodes (11): Dual-Level Reimbursement Pipeline (Demo), Reimbursement Approval Stage Not Enforced by Role, Two-Stage Reimbursement Approval Not Implemented, Permission Hierarchy & RBAC (leads-dashboard/README.md), 6-Tier Role System (PRD), Security & Access Control (PRD), Access Matrix by Route Group, Access Tiers (Actual 7-Tier System) (+3 more)

### Community 50 - "Events and Tasks Management Subsystem (Main Module)"
Cohesion: 0.25
Nodes (11): All Required Tasks Complete? (decision), 2. Committee Rosters Module, 5. Completion Triggers Module, 4. Deliverable Tracking Module, End: Event Concluded, 1. Event Creation Module, Events and Tasks Management Subsystem (Main Module), Reject/Correct Request (+3 more)

### Community 51 - "dispatchEmail"
Cohesion: 0.29
Nodes (9): ForgotPasswordSchema, POST(), POST(), buildTransporter(), diagnoseSmtpFailure(), dispatchEmail(), generateOtpEmailTemplate(), getEmailSettings() (+1 more)

### Community 52 - "app/layout.tsx"
Cohesion: 0.24
Nodes (7): geistMono, geistSans, metadata, HapticFeedbackProvider(), HapticPattern, PATTERNS, triggerHaptic()

### Community 53 - "task-email-queue.ts"
Cohesion: 0.25
Nodes (8): ActivationToken, getAppBaseUrl(), escapeHtml(), flushTaskEmailDigest(), pendingQueues, PendingTaskItem, RecipientQueue, TaskEmailRecipient

### Community 54 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, setup, start (+1 more)

### Community 55 - "empty-state.tsx"
Cohesion: 0.24
Nodes (5): EmptyStateProps, Ripple, RippleButton, RippleButtonProps, SkeletonProps

### Community 56 - "Reports & Analytics Module (PRD)"
Cohesion: 0.25
Nodes (8): Institutional Reports & Analytics (Demo), No PDF Export Exists (Only CSV), Reports & Analytics Module (PRD), Reports Module Copy, PDF/CSV Export, Report Types (By Event/Committee/Individual), Reports Module (Actual Flow), Analytics & Reports Module

### Community 57 - "button.tsx"
Cohesion: 0.25
Nodes (7): ButtonColor, ButtonProps, ButtonSize, ButtonVariant, COLOR_VARIANTS, Ripple, SIZES

### Community 58 - "Security & Encryption Strategy"
Cohesion: 0.29
Nodes (7): Tier-Based Access Control, Bank Account Details Rendered Unmasked, Vercel Deployment Plan, Security & Encryption Strategy, Recommended Stack (Next.js/Supabase/Vercel), Row-Level Security Access Control, Tech Stack (Actual)

### Community 59 - "progress.tsx"
Cohesion: 0.29
Nodes (5): COLOR_TRACKS, ProgressColor, ProgressProps, ProgressSize, SIZES

### Community 60 - "Member"
Cohesion: 0.48
Nodes (5): dispatchAnnouncementEmails(), DIVISION_SCOPES, resolveAnnouncementRecipients(), generateAnnouncementEmailTemplate(), Member

### Community 61 - "approval-sync.ts"
Cohesion: 0.33
Nodes (6): ApprovalPanelMember, AutoApprovalEntityType, ENTITY_LABELS, FanOutOptions, resolveApprovalPanel(), findApprovalRecipients()

### Community 62 - "matchingModulePolicies"
Cohesion: 0.33
Nodes (7): canEditGuestRecord(), canViewGuestRecord(), hasModuleViewOwnRestriction(), isOwnCreatedGuest(), isOwnCreatedRecordEditable(), matchingModulePolicies(), resolveModuleViewOverride()

### Community 63 - "Organisation Hierarchy"
Cohesion: 0.40
Nodes (5): Student Roster & Committee Reference Images, Faculty & Institutional Leadership, Organisation Hierarchy, Student Advisory Council, Student Core Council

### Community 64 - "decrypt-backup.js"
Cohesion: 0.40
Nodes (4): crypto, fs, path, resolvedPath

### Community 65 - "request-email-change/route.ts"
Cohesion: 0.67
Nodes (3): POST(), RequestEmailChangeSchema, generateEmailChangeOtpTemplate()

### Community 66 - "Member & Committee Directory Module (PRD)"
Cohesion: 0.50
Nodes (4): Member & Committee Directory Module (PRD), CSV Import Sync Gap, Directory Module (Actual Flow), Member Directory & Roster Module

### Community 67 - "generate_manual_docx.py"
Cohesion: 0.83
Nodes (3): create_manual(), set_cell_background(), set_cell_margins()

## Ambiguous Edges - Review These
- `Budget & Funds` → `Ratings & Performance`  [AMBIGUOUS]
  leads-dashboard/docs/module_data_flow_diagram.png · relation: shares_data_with
- `GroupPolicy` → `Submission`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: references
- `Guest` → `Member`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: references
- `Rating (upper, form-linked)` → `Rating (lower, member/event score)`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: conceptually_related_to
- `Rating (lower, member/event score)` → `Task`  [AMBIGUOUS]
  leads-dashboard/docs/database_er_diagram.png · relation: references
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
- **377 isolated node(s):** `FieldFillKind`, `DesignProofreadReview`, `SystemSettings`, `TaskDelegationEvent`, `UnifiedSponsor` (+372 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 423 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **52 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Budget & Funds` and `Ratings & Performance`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `GroupPolicy` and `Submission`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Guest` and `Member`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Rating (upper, form-linked)` and `Rating (lower, member/event score)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Rating (lower, member/event score)` and `Task`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Announcement table` and `GroupPolicy table`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Announcement table` and `Rating table (event-linked)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._