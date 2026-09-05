# Graph Report - ERP  (2026-09-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1690 nodes · 5275 edges · 130 communities (70 shown, 54 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `77c4f293`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- server-db.ts
- logAuditEvent
- requireSession
- email-service.ts
- CLAUDE.md (Root Architecture Guide)
- apiError
- permissions-server.ts
- permissions.ts
- readCollection
- tasks/page.tsx
- visiting-card-ocr.ts
- mutateCollection
- local-data.ts
- file-storage.ts
- app/page.tsx
- setup-superuser.js
- rate-limit.ts
- dashboard-shell.tsx
- isCentreHead
- forms/page.tsx
- ratings/page.tsx
- 3.0 Reimbursement Claim Submission
- Asset Intake & Validation (section)
- compilerOptions
- getEvents
- home/page.tsx
- Member
- policies/page.tsx
- devDependencies
- dependencies
- approvals/page.tsx
- EventItem
- LEADS All-in-One Dashboard Full System Review
- session.ts
- Kayomarz M Pavri
- sync-status.ts
- 4. Comprehensive Module Operating Instructions
- announcements/page.tsx
- reimbursements/page.tsx
- LEADS Dashboard Full Codebase Bug Audit
- chip.tsx
- avatar.tsx
- card.tsx
- docx-fill.ts
- Committee-Assigned Tasks Invisible to Everyone
- Member table
- backup.ts
- members/route.ts
- app/layout.tsx
- Reimbursement Portal Module (PRD)
- Events and Tasks Management Subsystem (Main Module)
- LEADS ERP Interactive Prototype
- package.json
- empty-state.tsx
- Ponytail
- form-qr-modal.tsx
- Reports & Analytics Module (PRD)
- Ponytail Help
- Security & Encryption Strategy
- button.tsx
- ack/route.ts
- progress.tsx
- ponytail-audit/SKILL.md
- Ponytail Gain
- ponytail-review/SKILL.md
- decrypt-backup.js
- LEADS All-in-One Dashboard (Product)
- ponytail-debt/SKILL.md
- Settings Change Password Is Fully Decorative
- generate_manual_docx.py
- Deployment Workflow (Standing Instruction)
- AGENTS.md
- ponytail.md
- deploy.sh
- gsap
- leads-dashboard/AGENTS.md
- isomorphic-dompurify
- jspdf-autotable
- eslint.config.mjs
- next.config.ts
- dictionary-en-gb
- html2canvas
- @napi-rs/canvas
- next
- nodemailer
- nspell
- pdfjs-dist
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
- qrcode
- react-dom
- recharts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `apiError()` - 163 edges
2. `requireSession()` - 152 edges
3. `mutateCollection()` - 128 edges
4. `logAuditEvent()` - 102 edges
5. `getAccessLevelSettingsServer()` - 88 edges
6. `readCollection()` - 87 edges
7. `isCentreHead()` - 58 edges
8. `getMembers()` - 56 edges
9. `getEvents()` - 51 edges
10. `serverPatch()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `Deployment Note: Single TrueNAS Instance` --semantically_similar_to--> `Self-Hosted Deployment (Hostinger KVM VPS)`  [INFERRED] [semantically similar]
  docs/changes-needed-for-claude.md → README.md
- `Vercel Deployment Plan` --semantically_similar_to--> `Self-Hosted Deployment (Hostinger KVM VPS)`  [INFERRED] [semantically similar]
  PROJECT DOCS/04-TechSpec-LEADSDashboard.md → README.md
- `Dynamic Public Form Builder & QR Codes (Demo)` --semantically_similar_to--> `Public Forms Builder Module`  [INFERRED] [semantically similar]
  demo/index.html → README.md
- `Analytics & Reports Module` --semantically_similar_to--> `Reports & Analytics Module (PRD)`  [INFERRED] [semantically similar]
  README.md → PROJECT DOCS/01-PRD-LEADSDashboard.md
- `Announcements Engine Module` --semantically_similar_to--> `Announcements & Email Alerts Module (PRD)`  [INFERRED] [semantically similar]
  README.md → PROJECT DOCS/01-PRD-LEADSDashboard.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Proposed-to-Actual Tech Stack Evolution** — project_docs_01_prd_leadsdashboard_leads_all_in_one_dashboard, project_docs_04_techspec_leadsdashboard_recommended_stack, readme_tech_stack [INFERRED 0.75]
- **Access Tier System Evolution (6-Tier Plan to 7-Tier Actual)** — project_docs_01_prd_leadsdashboard_role_tier_system, readme_access_tiers_matrix, project_docs_leadsarchitecture_access_tiers [INFERRED 0.80]
- **Backend Sync Reliability Fixes** — docs_bugs_to_fix_write_mutex_permanently_breaks, docs_bugs_to_fix_cross_device_polling_never_updates, docs_bugs_to_fix_committee_tasks_invisible, docs_changes_needed_for_claude_backend_sync_spec [INFERRED 0.85]

## Communities (130 total, 54 thin omitted)

### Community 0 - "server-db.ts"
Cohesion: 0.07
Nodes (52): Per-Collection Async Write Mutex, Write Mutex Permanently Breaks After First Error, decryptData(), deriveKey(), encryptData(), EncryptedPayload, FIXED_SALT, getMasterKey() (+44 more)

### Community 1 - "logAuditEvent"
Cohesion: 0.07
Nodes (84): BackupRestorePage(), DirectoryPage(), EventReportsPage(), emptyForm, GuestDirectoryPage(), applyMailMerge(), Guest, GuestInvitesPage() (+76 more)

### Community 2 - "requireSession"
Cohesion: 0.09
Nodes (51): GET(), POST(), DELETE(), PATCH(), GET(), POST(), DELETE(), PATCH() (+43 more)

### Community 3 - "email-service.ts"
Cohesion: 0.05
Nodes (58): RFC-5321, RFC-5545, EmailManagementPage(), PendingQueueItem, register(), BirthdayEmailLogEntry, monthDay(), msUntilNextMidnight() (+50 more)

### Community 4 - "CLAUDE.md (Root Architecture Guide)"
Cohesion: 0.07
Nodes (51): CLAUDE.md (Root Architecture Guide), accessLevelSettings Collection, accountActivations Collection, announcements Collection, auditLogs Collection, birthdayEmailLog Collection, budgets Collection, designs Collection (+43 more)

### Community 5 - "apiError"
Cohesion: 0.10
Nodes (41): GET(), POST(), ActivateAccountSchema, POST(), ChangePasswordSchema, POST(), ConfirmEmailChangeSchema, POST() (+33 more)

### Community 6 - "permissions-server.ts"
Cohesion: 0.10
Nodes (49): DELETE(), PATCH(), POST(), DELETE(), PATCH(), DELETE(), PATCH(), countActiveSuperUsersServer() (+41 more)

### Community 7 - "permissions.ts"
Cohesion: 0.13
Nodes (47): canViewTask(), getAccessLevelSettings(), GroupPolicy, ApprovalRequirement, canAddMember(), canBuildForms(), canCreateAnnouncement(), canCreateEvent() (+39 more)

### Community 8 - "readCollection"
Cohesion: 0.09
Nodes (35): GET(), POST(), GET(), GET(), maxDuration, POST(), GET(), maxDuration (+27 more)

### Community 9 - "tasks/page.tsx"
Cohesion: 0.14
Nodes (38): DesignPortalPage(), FestivalsPage(), TasksPage(), DelegateTaskModal(), DelegateTaskModalProps, GanttTimelineProps, DIVISION_SCOPES, addDesign() (+30 more)

### Community 10 - "visiting-card-ocr.ts"
Cohesion: 0.08
Nodes (39): OcrScanIssue, OcrScanPageImage, OcrScanResult, cleanWord(), getSpellCheckerUK(), getSpellCheckerUS(), getWorker(), INDIAN_ENGLISH_WHITELIST (+31 more)

### Community 11 - "mutateCollection"
Cohesion: 0.12
Nodes (34): DELETE(), PATCH(), DELETE(), DELETE(), isEventReportAuthor(), PATCH(), DELETE(), PATCH() (+26 more)

### Community 12 - "local-data.ts"
Cohesion: 0.10
Nodes (39): Group Policies, BudgetPage(), CATEGORY_OPTIONS, CHART_COLORS, CURRENT_FY, CURRENT_FY_START, FINANCIAL_YEARS, MONTH_NAMES (+31 more)

### Community 13 - "file-storage.ts"
Cohesion: 0.11
Nodes (27): PATCH(), POST(), GET(), NOTE: intentionally NOT gated with requireSession. Every avatar/attachment, PATCH(), maxDuration, POST(), GET() (+19 more)

### Community 14 - "app/page.tsx"
Cohesion: 0.10
Nodes (25): INSPIRATIONAL_QUOTES, LoginPage(), QuoteItem, SetupPage(), IosInstallPrompt(), isIos(), isStandalone(), LoadingScreen() (+17 more)

### Community 15 - "setup-superuser.js"
Cohesion: 0.09
Nodes (29): Direct Send SMTP Setup, DKIM/SPF/DMARC DNS Configuration, Full DNS Rebuild & Mail Verification, Super User Setup Process, PM2/Nginx/Certbot Bootstrap, VPS Setup Bootstrap Procedure, log(), vps-setup.sh script (+21 more)

### Community 16 - "rate-limit.ts"
Cohesion: 0.13
Nodes (29): accountBackoff, AUTH_MAX(), AUTH_WINDOW_MS(), AUTHENTICATED_MAX(), AUTHENTICATED_WINDOW_MS(), BACKOFF_BASE_MS(), BACKOFF_MAX_MS(), BACKOFF_RESET_AFTER_MS() (+21 more)

### Community 17 - "dashboard-shell.tsx"
Cohesion: 0.12
Nodes (22): allSidebarItems, DashboardShell(), loadSeenActionIds(), NavSection, navSections, saveSeenActionIds(), SidebarItem, NotFoundScreen() (+14 more)

### Community 18 - "isCentreHead"
Cohesion: 0.14
Nodes (30): getGroupPolicies(), isTaskAssignee(), canApproveAnnouncement(), canApprovePendingEvent(), canApprovePendingForm(), canApprovePendingTask(), canChangeTaskStatus(), canEvaluateEventStudent() (+22 more)

### Community 19 - "forms/page.tsx"
Cohesion: 0.17
Nodes (28): buildCategoryChartData(), buildFieldCounts(), buildScaleChartData(), buildSubmissionsByDay(), CHART_COLORS, CHARTABLE_TYPES, chartCountDomainMax(), computeAverage() (+20 more)

### Community 20 - "ratings/page.tsx"
Cohesion: 0.18
Nodes (23): isDesignTask(), RatingsPage(), ReportsPage(), PeriodFilter(), PeriodFilterProps, SearchableSelect(), SearchableSelectOption, SearchableSelectProps (+15 more)

### Community 21 - "3.0 Reimbursement Claim Submission"
Cohesion: 0.09
Nodes (28): Allocation Data (input), 1.0 Annual Budget Allocation, 1.1 Budget Module (Stores & Manages Allocation), 3.1 Claim Validation (Syntax Checks), 8.0 Financial Reporting, Funding Available? (Decision), Funding Denied (Holds Claim, Notifies Finance), Grants (input) (+20 more)

### Community 22 - "Asset Intake & Validation (section)"
Cohesion: 0.16
Nodes (26): AI-Powered OCR Scan & Data Extraction, Answer Ingestion & Data Capture, Asset Intake & Validation (section), Auto-Complete Linked Tasks & Requirements, Combined Gates Pass Decision, Data Processing & Document Generation (section), Design Asset Upload, DOCX Document Generated & Stored (+18 more)

### Community 23 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 24 - "getEvents"
Cohesion: 0.24
Nodes (25): EventDetailPage(), EventsPage(), EventStatusFilter, addEvent(), addEventCommittee(), approveEvent(), approveEventCommittee(), deleteEvent() (+17 more)

### Community 25 - "home/page.tsx"
Cohesion: 0.18
Nodes (21): CalendarPage(), DashboardHome(), addDays(), countInWindow(), daysBetween(), GanttTimeline(), parseDate(), STATUS_COLORS (+13 more)

### Community 26 - "Member"
Cohesion: 0.16
Nodes (23): Announcements Engine, Budget & Funds, Design Portal, Dynamic Group Policies, Events Desk, Executive Reports, Guest Directory, Public Forms (+15 more)

### Community 27 - "policies/page.tsx"
Cohesion: 0.12
Nodes (23): ALL_DIVISIONS, ALL_TIERS, EVERYONE_ELSE_RULE, GroupPoliciesPage(), memberMatchesCriteria(), ModuleAccessGrant, ModuleAccessMap, slugifyTag() (+15 more)

### Community 28 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/adm-zip (+15 more)

### Community 29 - "dependencies"
Cohesion: 0.10
Nodes (21): adm-zip, jspdf, jszip, dependencies, adm-zip, dictionary-en, jspdf, jszip (+13 more)

### Community 30 - "approvals/page.tsx"
Cohesion: 0.23
Nodes (15): ApprovalsPage(), entityIcon(), entityLink(), statusBadge(), Tab, RequestApprovalModal(), RequestApprovalModalProps, ApprovalRequest (+7 more)

### Community 31 - "EventItem"
Cohesion: 0.16
Nodes (16): EventItem, RatingItem, average(), BORDER_LIGHT, BRAND_ACCENT, BRAND_PRIMARY, CapturedChartImage, ensureSpace() (+8 more)

### Community 32 - "LEADS All-in-One Dashboard Full System Review"
Cohesion: 0.20
Nodes (10): Cross-Device Polling Never Actually Updates Open Screen, Add Live Sync Between Open Sessions (Polling), LEADS All-in-One Dashboard Full System Review, Bar Chart Colors Hardcoded, Not Rating-Scale Driven, Logout Doesn't Clear Session, No Real Backend or Auth (Client-Only), Rating Color Scale, Chart Requirements (+2 more)

### Community 33 - "session.ts"
Cohesion: 0.20
Nodes (11): POST(), POST(), POST(), canManageBackup(), extractToken(), getSession(), getSessionMember(), hashToken() (+3 more)

### Community 34 - "Kayomarz M Pavri"
Cohesion: 0.17
Nodes (12): Student Roster & Committee Reference Images, Public /forms/[slug] Route Group, Color Palette, Public Form Module Copy, Tone Guidelines, Forms & Public Submissions Module (Actual Flow), Public Forms Builder Module, Faculty & Institutional Leadership (+4 more)

### Community 35 - "sync-status.ts"
Cohesion: 0.26
Nodes (13): SyncStatusPill(), beginSync(), dismissSyncEntry(), entries, getSyncEntries(), getSyncSuccessFlash(), listeners, notify() (+5 more)

### Community 36 - "4. Comprehensive Module Operating Instructions"
Cohesion: 0.13
Nodes (14): 1. Executive System Overview, 2. One-Time Initial Setup Wizard, 3. Granular Role & Privilege Matrix (Tiers 1 to 7), 4.1 Members Directory & User Management, 4.2 Dynamic Quick Switch (Super User Feature), 4.3 Events & Automated Task Delegation, 4.4 Design Portal & Multi-Gate Proofreading Engine, 4.5 Multi-Stage Financial Reimbursement Pipeline (+6 more)

### Community 37 - "announcements/page.tsx"
Cohesion: 0.30
Nodes (13): AnnouncementsPage(), ConfirmModal(), ConfirmModalProps, addAnnouncement(), AnnouncementItem, approveAnnouncement(), deleteAnnouncement(), getAnnouncements() (+5 more)

### Community 38 - "reimbursements/page.tsx"
Cohesion: 0.29
Nodes (13): ReimbursementsPage(), addReimbursement(), getReimbursements(), ReceiptFile, saveReimbursements(), updateReimbursementStatus(), verifyReimbursementByCentreHead(), anyKeywordMatches() (+5 more)

### Community 39 - "LEADS Dashboard Full Codebase Bug Audit"
Cohesion: 0.14
Nodes (15): REST API Layer (One Folder Per Collection), Flat JSON File Database, Audit Log Unbounded on Client, Capped Inconsistently on Server, Dead Un-Mutex'd Write Path in /api/data, LEADS Dashboard Full Codebase Bug Audit, Public Form Slugs Not Checked for Uniqueness Server-Side, Test-Persona Tiers Contradict App's Own Role/Tier Table, Backend Sync Fix Implementation Spec (+7 more)

### Community 40 - "chip.tsx"
Cohesion: 0.15
Nodes (12): PromotionData, PromotionModal(), PromotionModalProps, Button(), Chip(), ChipColor, ChipProps, ChipSize (+4 more)

### Community 41 - "avatar.tsx"
Cohesion: 0.15
Nodes (9): Avatar(), AvatarColor, AvatarContext, AvatarContextValue, AvatarFallbackProps, AvatarGroupProps, AvatarImageProps, AvatarProps (+1 more)

### Community 42 - "card.tsx"
Cohesion: 0.18
Nodes (7): CardBodyProps, CardFooterProps, CardHeaderProps, CardProps, createParticleElement(), ParticleCard(), ParticleCardProps

### Community 43 - "docx-fill.ts"
Cohesion: 0.23
Nodes (10): GET(), NOTE: intentionally NOT gated with requireSession. The Forms dashboard, buildDefaultTokens(), escapeXml(), FIELD_FILL_MAP, FieldFillKind, fillFeedbackFormDocx(), TEMPLATE_PATH (+2 more)

### Community 44 - "Committee-Assigned Tasks Invisible to Everyone"
Cohesion: 0.20
Nodes (10): Task Traceability Matrix (Demo), Committee-Assigned Tasks Invisible to Everyone, Duplicated Permission Logic Across Screens, Task Management Module (PRD), Dashboard Route Tree, Task Module Copy, canViewTask() Visibility Logic, Ratings Module (Actual Flow) (+2 more)

### Community 45 - "Member table"
Cohesion: 0.31
Nodes (13): Announcement table, Budget table, Design table, Event table, GroupPolicy table, Guest table, Member table, PublicForm table (+5 more)

### Community 46 - "backup.ts"
Cohesion: 0.30
Nodes (10): BackupSummary, buildZipBuffer(), createEncryptedBackup(), DATA_DIR, decryptBackup(), deriveKey(), InvalidPassphraseError, listFilesRecursive() (+2 more)

### Community 47 - "members/route.ts"
Cohesion: 0.27
Nodes (8): POST(), GET(), MemberCreateSchema, POST(), ActivationToken, createActivationTokenAndSendEmail(), generateWelcomeActivationEmailTemplate(), MemberWriteSchema

### Community 48 - "app/layout.tsx"
Cohesion: 0.24
Nodes (7): geistMono, geistSans, metadata, HapticFeedbackProvider(), HapticPattern, PATTERNS, triggerHaptic()

### Community 49 - "Reimbursement Portal Module (PRD)"
Cohesion: 0.29
Nodes (7): Dual-Level Reimbursement Pipeline (Demo), Reimbursement Approval Stage Not Enforced by Role, Two-Stage Reimbursement Approval Not Implemented, Reimbursement Portal Module (PRD), Reimbursement Module Copy, Reimbursements Module (Actual Flow), Reimbursements System Module

### Community 50 - "Events and Tasks Management Subsystem (Main Module)"
Cohesion: 0.25
Nodes (11): All Required Tasks Complete? (decision), 2. Committee Rosters Module, 5. Completion Triggers Module, 4. Deliverable Tracking Module, End: Event Concluded, 1. Event Creation Module, Events and Tasks Management Subsystem (Main Module), Reject/Correct Request (+3 more)

### Community 51 - "LEADS ERP Interactive Prototype"
Cohesion: 0.20
Nodes (10): Dynamic Public Form Builder & QR Codes (Demo), Event Proposals & Orchestration (Demo), Institutional Reports & Analytics (Demo), LEADS ERP Interactive Prototype, getCommittees() Fallback List Doesn't Reflect Per-Event Model, Event Management Module (PRD), Events Module (Actual Flow), Reports Module (Actual Flow) (+2 more)

### Community 52 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, setup, start (+1 more)

### Community 53 - "empty-state.tsx"
Cohesion: 0.24
Nodes (5): EmptyStateProps, Ripple, RippleButton, RippleButtonProps, SkeletonProps

### Community 54 - "Ponytail"
Cohesion: 0.22
Nodes (8): Boundaries, Intensity, Output, Persistence, Ponytail, Rules, The ladder, When NOT to be lazy

### Community 55 - "form-qr-modal.tsx"
Cohesion: 0.39
Nodes (8): canvasToBlob(), drawCenterLogo(), FormQrModal(), FormQrModalProps, getFormTypeLabel(), isIOSDevice(), FormTemplateItem, PublicFormItem

### Community 56 - "Reports & Analytics Module (PRD)"
Cohesion: 0.40
Nodes (5): No PDF Export Exists (Only CSV), Reports & Analytics Module (PRD), Reports Module Copy, PDF/CSV Export, Report Types (By Event/Committee/Individual)

### Community 57 - "Ponytail Help"
Cohesion: 0.25
Nodes (7): Configure Default Mode, Deactivate, Levels, More, Ponytail Help, Skills, Update

### Community 58 - "Security & Encryption Strategy"
Cohesion: 0.15
Nodes (13): Tier-Based Access Control, Bank Account Details Rendered Unmasked, Permission Hierarchy & RBAC (leads-dashboard/README.md), 6-Tier Role System (PRD), Security & Access Control (PRD), Access Matrix by Route Group, Vercel Deployment Plan, Security & Encryption Strategy (+5 more)

### Community 59 - "button.tsx"
Cohesion: 0.25
Nodes (7): ButtonColor, ButtonProps, ButtonSize, ButtonVariant, COLOR_VARIANTS, Ripple, SIZES

### Community 60 - "ack/route.ts"
Cohesion: 0.43
Nodes (6): GET(), POST(), canChangeTaskStatus(), isEventsHeadRtcCampus(), isHeadOfEvents(), isTaskAssignee()

### Community 61 - "progress.tsx"
Cohesion: 0.29
Nodes (5): COLOR_TRACKS, ProgressColor, ProgressProps, ProgressSize, SIZES

### Community 62 - "ponytail-audit/SKILL.md"
Cohesion: 0.40
Nodes (4): Boundaries, Hunt, Output, Tags

### Community 63 - "Ponytail Gain"
Cohesion: 0.40
Nodes (4): Boundaries, Honesty boundary, Ponytail Gain, Scoreboard

### Community 64 - "ponytail-review/SKILL.md"
Cohesion: 0.40
Nodes (4): Boundaries, Examples, Format, Scoring

### Community 65 - "decrypt-backup.js"
Cohesion: 0.40
Nodes (4): crypto, fs, path, resolvedPath

### Community 66 - "LEADS All-in-One Dashboard (Product)"
Cohesion: 0.15
Nodes (13): Member Performance & Evaluation (Demo), Announcements & Email Alerts Module (PRD), LEADS All-in-One Dashboard (Product), Member & Committee Directory Module (PRD), Rating & Evaluation Module (PRD), Announcements Copy, Rating Module Copy, Announcements Module (Actual Flow) (+5 more)

### Community 67 - "ponytail-debt/SKILL.md"
Cohesion: 0.50
Nodes (3): Boundaries, Output, Scan

### Community 68 - "Settings Change Password Is Fully Decorative"
Cohesion: 0.50
Nodes (4): Settings Change Password Is Fully Decorative, Settings Module (Actual Flow), Settings Writes Never Reach Server Gap, System & Account Settings Module

### Community 69 - "generate_manual_docx.py"
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
- **422 isolated node(s):** `deploy.sh script`, `eslintConfig`, `nextConfig`, `name`, `version` (+417 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 478 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

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