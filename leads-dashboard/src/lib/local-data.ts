export type MemberDivision = 'Advisory Board' | 'Core Committee' | 'Training Associate' | 'Alumni' | 'Faculty';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: number;
  division: MemberDivision;
  committee?: string; // Legacy fallback
  department?: string;
  program?: string; // e.g. "B.Tech Computer Science Engineering", "MBA"
  batch?: string; // e.g. "Class of 2025" for Alumni
  passwordHash?: string; // scrypt hash ("salt:hash"), set via password.ts — never plaintext
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  // "YYYY-MM-DD". Collected once at account activation (or added later from
  // Settings) — used only to match month+day for the daily birthday email
  // (see src/lib/birthday-scheduler.ts). Optional: older members activated
  // before this field existed simply won't get a birthday email until set.
  dateOfBirth?: string;
  // Undefined/'Active' = normal login access. 'Terminated' = login is blocked
  // (see /api/auth/login) but the member row itself, and every historical
  // record that references it by id/name/email, is left untouched.
  status?: 'Active' | 'Terminated';
  terminatedAt?: string;
  terminatedBy?: string;
  avatarData?: string;       // transient: base64 data URL sent on upload, converted server-side
  avatarFileName?: string;   // transient: original filename, paired with avatarData
  avatarUrl?: string;        // servable path under /api/files, backed by a real file on disk
  avatarStorageKey?: string; // path relative to data/uploads
  mustSetupPassword?: boolean; // Super User admin override: user must set password without OTP on next login
}

// A person encountered outside the org (event guest, sponsor contact, vendor,
// etc.) — sourced from a visiting card, kept in a directory of its own,
// separate from the Member roster and from the ad-hoc Guest Invites tool.
export interface Guest {
  id: string;
  name: string;
  organization?: string;
  designation?: string;
  phone?: string;
  email?: string;
  website?: string; // company website
  address?: string;
  linkedin?: string; // LinkedIn profile URL
  notes?: string;
  metBy?: string; // name of the member who met them
  visitingCardData?: string; // transient: base64 data URL sent on upload, converted server-side
  visitingCardUrl?: string;  // servable path under /api/files, backed by a real file on disk
  visitingCardStorageKey?: string;
  createdAt: string;
}

export interface EventCommittee {
  id: string;
  name: string; // e.g. "Stage & Audio-Visual", "Hospitality & Logistics", "Design & Media"
  leadMemberId?: string;
  leadMemberName?: string;
  memberIds: string[]; // Students participating in this event committee
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  // When true, startDate/endDate are placeholders (empty) — the event is
  // confirmed to happen but exact dates aren't set yet. Every date-range
  // display/sort/day-grid-match site must check this before trusting
  // startDate/endDate (see formatEventDateRange below).
  datesTBD?: boolean;
  status: 'planned' | 'active' | 'completed' | 'archived';
  location?: string;
  campus?: 'GG Campus' | 'RTC Campus' | 'Both Campuses';
  committees: EventCommittee[];
  createdBy?: string;
  // Group Policy approval workflow — set only when the creator/editor's grant came
  // from a policy tag marked "requires approval." Absent/'approved' means normal,
  // immediately-effective events (every event created before this feature, and
  // every one created by someone with a built-in or non-approval-gated grant).
  approvalStatus?: 'pending_create' | 'pending_edit' | 'approved' | 'rejected';
  pendingChange?: Partial<EventItem>; // for pending_edit: the proposed diff, applied on approval
  approverType?: 'CENTER_HEAD' | 'SPECIFIC_MEMBER' | 'POLICY_TAG';
  approverMemberId?: string;
  approverPolicyTagId?: string;
  approvalPolicyName?: string;
  submittedBy?: string;
  submittedByEmail?: string;
  decidedBy?: string;
  decidedAt?: string;
  rejectionReason?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  event?: string;
  eventId?: string;
  eventCampus?: 'GG Campus' | 'RTC Campus' | 'Both Campuses';
  eventCommitteeId?: string;
  eventCommitteeName?: string;
  assignee: string;
  assigneeId?: string;
  assigneeEmail?: string;
  // 'group' is an ad-hoc set of individual students picked directly for this
  // task (assigneeIds) — unlike 'committee', it isn't tied to any event's
  // formal EventCommittee record and doesn't require an event at all.
  assigneeType: 'individual' | 'committee' | 'group';
  assigneeIds?: string[]; // set when assigneeType === 'group'
  dueDate: string;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Pending Extension';
  creatorName?: string;
  extensionReason?: string;
  decidedBy?: string;
  decidedAt?: string;
  ratingScore?: number;
  ratedAt?: string;
  // Set by syncDesignTask() when this task was auto-created/completed from a
  // Style-Approved Design Portal submission — lets the Ratings page grant
  // Design Heads evaluation rights on it (see permissions.ts) without
  // relying on a fragile title-string match.
  isDesignDeliverable?: boolean;
}

export interface RatingItem {
  id: string;
  taskId: string;
  taskTitle: string;
  eventId?: string;
  eventName?: string;
  targetId: string; // Member ID
  targetName: string; // Member Name
  raterName: string;
  quality: number;
  timeliness: number;
  initiative: number;
  collaboration: number;
  overallScore: number;
  notes?: string;
  quarter?: string; // e.g. "2026-Q3"
  createdAt: string;
  updatedAt?: string;
}

export interface ReceiptFile {
  name: string;
  dataUrl?: string; // legacy: inline base64 — new uploads use url/storageKey instead
  url?: string; // servable path under /api/files, backed by a real file on disk
  storageKey?: string; // path relative to data/uploads
  type?: string;
}

export interface ReimbursementItem {
  id: string;
  memberName: string;
  memberEmail: string;
  amount: number;
  category: string;
  description: string;
  receiptUrl?: string;
  receiptData?: string; // Legacy fallback
  receiptFiles?: ReceiptFile[]; // Up to 3 attached bills & supporting documents
  status: 'Pending' | 'Verified by Centre Head' | 'Under Review' | 'Approved' | 'Denied';
  bankDetails: string; // Summary string formatted for legacy/display
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  submittedAt: string;
  centreHeadVerified?: boolean;
  centreHeadVerifiedBy?: string;
  centreHeadVerifiedAt?: string;
  firstPassReviewer?: string;
  finalApprover?: string;
  decidedAt?: string;
  eventId?: string;
  eventName?: string;
}

export interface BudgetLineItem {
  eventId?: string;  // set when the line item points at an existing event
  eventName: string; // display label — an existing event's title, or a free-typed name for an event not created yet
  amount: number;
}

export interface BudgetItem {
  id: string;
  type: 'event' | 'monthly';
  eventId?: string;  // set when type === 'event'
  eventName?: string;
  month?: string;    // set when type === 'monthly', 'YYYY-MM'
  amount: number;
  // Set on a 'monthly' budget proposed as a breakdown of per-event costs
  // (the Centre Head lists each planned event for the month and what it
  // will cost); `amount` is always kept equal to the sum of these.
  // A 'monthly' budget submitted without a breakdown (or an 'event' one)
  // leaves this undefined.
  lineItems?: BudgetLineItem[];
  notes?: string;
  submittedBy: string;
  submittedByEmail?: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  decidedBy?: string;
  decidedAt?: string;
  decisionNotes?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  scope: string; // 'All Members' | 'Advisory Board' | 'Core Committee' | 'Training Associate' | 'Alumni'
  authorName: string;
  publishedAt: string;
  editedAt?: string;
  status?: 'Pending Approval' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'number' | 'scale';
  options?: string[];
  required: boolean;
}

export interface PublicFormItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  fields: FormField[];
  committee: string;
  createdBy: string;
  createdAt: string;
  isSample?: boolean;
  status: 'active' | 'archived';
  eventId?: string;
  eventName?: string;
}

export interface FormTemplateItem {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  createdBy: string;
  createdAt: string;
}

export interface FormSubmissionItem {
  id: string;
  formId: string;
  slug: string;
  data: Record<string, any>;
  submittedAt: string;
  isSample?: boolean;
}

export interface DesignProofreadReview {
  proofreaderId: string;
  proofreaderName: string;
  status: 'Pending Proofread' | 'Proofread Approved' | 'Changes Requested';
  comments?: string;
  reviewedAt?: string;
}

export interface DesignSubmissionItem {
  id: string;
  title: string;
  description?: string;
  category: 'Poster' | 'Banner' | 'Social Media' | 'Brochure' | 'Certificates' | 'Other';
  fileData?: string;      // legacy: inline base64 — new uploads use fileUrl/storageKey instead
  fileUrl?: string;       // servable path under /api/files, backed by a real file on disk
  storageKey?: string;    // path relative to data/uploads
  fileName: string;
  fileSize: number;       // Size in bytes (must be <= 25 * 1024 * 1024)
  fileType: string;       // MIME type (e.g. image/png, application/pdf)
  designerId: string;
  designerName: string;
  designerEmail: string;
  submittedAt: string;    // ISO timestamp
  expiresAt: string;      // ISO timestamp (submittedAt + 30 days)
  isExpired?: boolean;
  proofreadRequested: boolean;
  assignedProofreaderId?: string;
  assignedProofreaderName?: string;
  assignedProofreaderEmail?: string;
  review?: DesignProofreadReview;
  styleStatus?: 'Pending' | 'Style Approved' | 'Style Rejected';
  styleFeedback?: string;
  styleDecidedBy?: string;
  styleDecidedAt?: string;
  eventId?: string;
  eventName?: string;
  // Set once a Style Approved design linked to an event auto-creates a
  // matching Completed task (see updateDesignStyleReview) — lets repeat
  // approvals (e.g. approved -> changes requested -> re-approved) reuse the
  // same task instead of creating a duplicate each time.
  linkedTaskId?: string;
  linkedInstagramTaskId?: string;
  linkedLinkedinTaskId?: string;
  isSample?: boolean;
  // Optional automated OCR + spell-check pass run client-side at upload time
  // (see /api/designs/ocr-scan). Purely advisory — never validated or
  // enforced server-side, just carried along for the Proofreading Desk to
  // show what the automated pass already flagged.
  ocrScan?: OcrScanResult;
}

export interface OcrScanIssue {
  word: string;
  suggestions: string[];
  pageIndex: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrScanPageImage {
  dataUrl: string;
  // Pixel dimensions of the ORIGINAL page the bbox coordinates above were
  // measured against — not necessarily the dataUrl's own resolution, which
  // may be downscaled for payload size. Highlight boxes are positioned by
  // percentage, so this is all a consumer needs regardless of preview size.
  width: number;
  height: number;
}

export interface OcrScanResult {
  extractedText: string;
  pageCount: number;
  totalPages: number;
  partial: boolean; // true if a PDF had more pages than were scanned
  issues: OcrScanIssue[];
  pageImages: OcrScanPageImage[];
  scannedAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorName: string;
  actorEmail: string;
  target?: string;
  details: string;
  timestamp: string;
}

/**
 * Access Level Settings: the thresholds/keywords behind the hardcoded tier
 * and role rules in permissions.ts (Base Leadership, Core Committee, "Head"
 * designation, Sector Head, Finance Head), editable by the Super User from
 * the Group Policies page's "Built-in Access Rules" panel instead of living
 * only as numbers/regexes in code. Always exactly one record (id: 'default').
 *
 * Tier 1 (Super User) itself is deliberately NOT represented here and never
 * will be — it's the one access rule that stays permanently hardcoded, so
 * there's no configuration that can ever lock the real Super User out.
 */
export interface AccessLevelSettings {
  id: string; // always 'default'
  baseLeadershipMaxTier: number; // tier <= this counts as "Base Leadership"
  coreCommitteeTier: number; // tier === this counts as "Core Committee"
  sectorHeadMaxTier: number; // tier <= this counts as Sector/Centre Head outright
  headKeyword: string; // whole-word, case-insensitive match against Member.role
  sectorHeadKeywords: string; // comma-separated phrases, e.g. "sector head, centre head, center head"
  financeKeyword: string; // whole-word, case-insensitive match against role or department
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_ACCESS_LEVEL_SETTINGS: AccessLevelSettings = {
  id: 'default',
  baseLeadershipMaxTier: 3,
  coreCommitteeTier: 5,
  sectorHeadMaxTier: 2,
  headKeyword: 'head',
  sectorHeadKeywords: 'sector head, centre head, center head',
  financeKeyword: 'finance',
};

/**
 * Site-wide lockdown switch. When enabled, every dashboard page renders a
 * generic "Page Not Found" screen instead of its real content for everyone
 * except the Super User (tier 1, hardcoded — same as access-level settings,
 * there is no configuration that can lock the real Super User out).
 */
export interface SystemSettings {
  id: string; // always 'default'
  lockdownEnabled: boolean;
  lockdownEnabledAt?: string;
  lockdownEnabledBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  id: 'default',
  lockdownEnabled: false,
};

export const initialSystemSettings: SystemSettings[] = [DEFAULT_SYSTEM_SETTINGS];

/**
 * Group Policy: a dynamically Super-User-managed access "tag." Grants a set of
 * capability keys to any member matching ANY of its non-empty target criteria
 * (division / tier / designation keyword / explicit member) — no code change
 * required to grant or revoke access. See permissions.ts's hasCapability() for
 * the resolution logic and CAPABILITY_CATALOG for the grantable capabilities.
 */
export interface GroupPolicy {
  id: string;
  tag: string; // short unique code, e.g. "JUNIOR_EVENT_LEAD" — used for display/reference
  name: string; // human-readable name, e.g. "Junior Event Lead Access"
  description?: string;
  capabilities: string[]; // capability keys from CAPABILITY_CATALOG this tag grants
  targetDivisions: MemberDivision[];
  targetTiers: number[];
  targetDesignationKeyword?: string; // substring match against Member.role, case-insensitive
  targetMemberIds: string[]; // explicit individual overrides
  enabled: boolean;
  // If set, the policy stops granting anything once this ISO timestamp passes —
  // for a temporary grant instead of a permanent one. Enforced everywhere
  // enabled policies are matched (permissions.ts's isPolicyActive()); the
  // record itself is never deleted, so it's easy to see what expired and when.
  expiresAt?: string;
  // If set, restricts members matching this policy's targeting to seeing only
  // events they created or are listed on a committee for, instead of the default
  // (unrestricted) visibility every member has today. Purely restrictive — never
  // grants visibility beyond the default, only narrows it for the targeted group.
  eventVisibilityScope?: 'OWN_ONLY';
  // If set, any capability this policy grants only takes effect once a designated
  // approver signs off — the grantee's action lands in a pending state instead of
  // applying immediately. See permissions.ts's getApprovalRequirement().
  requiresApproval?: boolean;
  approverType?: 'CENTER_HEAD' | 'SPECIFIC_MEMBER' | 'POLICY_TAG';
  approverMemberId?: string; // when approverType === 'SPECIFIC_MEMBER'
  approverPolicyTagId?: string; // when approverType === 'POLICY_TAG' — id of another GroupPolicy
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// Shared default password ("Kayo29") every seeded account starts with, scrypt-hashed —
// members should change this from Settings once they can log in. Precomputed once via
// password.ts's hashPassword('Kayo29') rather than computed at import time.
const DEFAULT_PASSWORD_HASH = '039e521fbfd304a0a97bf0ad345fa30c:fabe61e51b9670355e96fa18763974f718215fdff2533c42e3da9fb81bd21f62780271331c4c3fa2f1a10cf452a180b13b45d2aa41604ed02620cb7bf8af2135';

// Real organization roster matching production faculty leadership and super user
const initialMembersRaw: Member[] = [
  { id: 'm1', name: 'Kayomarz Pavri', email: 'kayo2970@gmail.com', role: 'Super User', tier: 1, division: 'Core Committee', department: 'Design and Social Media' },
  { id: 'm2', name: 'Dr. Subhadeep Mukherjee', email: 'subhadeepmukherjee.ms.mc@msruas.ac.in', role: 'Centre Head', tier: 2, division: 'Faculty', department: 'Faculty Oversight' },
  { id: 'm3', name: 'Dr. Kiran Kumar B M', email: 'kiran.kumar@msruas.ac.in', role: 'Head of Events', tier: 3, division: 'Faculty', department: 'Faculty Oversight' },
  { id: 'm4', name: 'Dr. K. M. Sharath Kumar', email: 'sharath.kumar@msruas.ac.in', role: 'Advisory Board Member', tier: 3, division: 'Faculty', department: 'Faculty Advisory' },
  { id: 'm7', name: 'Dr. Hari Krishna S', email: 'hari.krishna@msruas.ac.in', role: 'Faculty Advisor', tier: 3, division: 'Faculty', department: 'Faculty Advisory' },
  { id: 'm10', name: 'Dr. Pallabi Mund', email: 'pallabimund.ms.mc@msruas.ac.in', role: 'Head of Events GG Campus', tier: 2.5, division: 'Faculty', department: 'Events' },
  { id: 'm11', name: 'Dr. Ajay R', email: 'ajay.ca.mc@msruas.ac.in', role: 'Faculty Advisor', tier: 3, division: 'Faculty', department: 'Faculty Advisory' },
  { id: 'm12', name: 'Ms. Sujata Bijwe', email: 'sujata.bijwe@msruas.ac.in', role: 'Faculty Advisor', tier: 3, division: 'Faculty', department: 'Faculty Advisory' },
];

export const initialMembers: Member[] = initialMembersRaw.map(m => ({
  ...m,
  passwordHash: m.passwordHash || DEFAULT_PASSWORD_HASH,
}));

export const initialEvents: EventItem[] = [];

export const initialTasks: TaskItem[] = [];

export const initialRatings: RatingItem[] = [];

export const initialReimbursements: ReimbursementItem[] = [];

export const initialBudgets: BudgetItem[] = [];

export const initialAnnouncements: AnnouncementItem[] = [];

export const initialForms: PublicFormItem[] = [];

export const initialFormTemplates: FormTemplateItem[] = [];

export const initialSubmissions: FormSubmissionItem[] = [];

export const initialDesigns: DesignSubmissionItem[] = [];

export const initialGroupPolicies: GroupPolicy[] = [];

export const initialGuests: Guest[] = [];

export const initialAccessLevelSettings: AccessLevelSettings[] = [DEFAULT_ACCESS_LEVEL_SETTINGS];

// -------------------------------------------------------------
// Server Sync & Per-Collection API Helpers
// -------------------------------------------------------------

// Timestamp of the most recent local write to each collection (by localStorage
// key). Lets a sync poll tell whether its response is stale relative to a
// mutation that happened while the request was in flight — see hydrateIfStale.
const lastLocalWriteAt: Record<string, number> = {};

/** Record that `key` was just written locally (called at the end of every
 * saveX()/direct localStorage.setItem write in this file). */
function markLocalWrite(key: string): void {
  lastLocalWriteAt[key] = Date.now();
}

// How long to distrust a sync poll's response for a collection after we
// wrote to it locally. The mutation's own POST/PATCH/DELETE is fire-and-forget
// (never awaited by its caller), so comparing the poll's *start* time against
// our write time isn't quite enough: a poll's GET can reach the server and
// read the file before our own write's request does, even if our write
// started first from the client. A flat suppression window sidesteps that —
// it's vastly more time than a same-server POST needs to land (well under a
// second in practice), while staying far short of the 7s poll cadence, so
// the very next poll after this one is guaranteed to see our change.
const STALE_HYDRATE_SUPPRESSION_MS = 4000;

/**
 * Write a collection fetched from the server into localStorage, verbatim —
 * including a legitimately empty array — UNLESS we wrote to this collection
 * locally within the last `STALE_HYDRATE_SUPPRESSION_MS`. Without that guard,
 * a poll that was in flight (or raced our own write at the server) when the
 * user made a change (e.g. created an event, approved a design) can resolve
 * carrying the server's PRE-change state, silently reverting the just-made
 * change in the UI even though it saved successfully — the next poll, well
 * after our write, doesn't have this problem and will correctly reflect it.
 * The bundled sample data is never written here; it only ever appears as
 * each getX()'s own in-memory fallback before the first sync resolves (see
 * below) — that's the true first-run/offline experience. Once a sync
 * resolves, even to an empty collection, that's what's shown from then on.
 */
function hydrateIfStale(key: string, serverArray: unknown, requestStartedAt: number): void {
  if (!Array.isArray(serverArray)) return;
  const writtenAt = lastLocalWriteAt[key];
  if (writtenAt !== undefined && requestStartedAt - writtenAt < STALE_HYDRATE_SUPPRESSION_MS) return;
  localStorage.setItem(key, JSON.stringify(serverArray));
}

/**
 * Fetch all collections from the server and hydrate localStorage.
 * Server data wins over anything not written locally since this request
 * started (see hydrateIfStale) — this is safe to call repeatedly (polling).
 * Before the first sync ever resolves, each getX() shows bundled sample data
 * from memory without persisting it (see the "Do NOT seed localStorage here"
 * getters below) — that's the true first-run/offline experience. Once a sync
 * resolves, even to an empty collection, that's what's shown from then on.
 */
export async function syncWithServer(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const requestStartedAt = Date.now();
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    if (data && typeof data === 'object') {
      hydrateIfStale('leads_members', data.members, requestStartedAt);
      hydrateIfStale('leads_events', data.events, requestStartedAt);
      hydrateIfStale('leads_tasks', data.tasks, requestStartedAt);
      hydrateIfStale('leads_ratings', data.ratings, requestStartedAt);
      hydrateIfStale('leads_reimbursements', data.reimbursements, requestStartedAt);
      hydrateIfStale('leads_announcements', data.announcements, requestStartedAt);
      hydrateIfStale('leads_custom_forms', data.forms, requestStartedAt);
      hydrateIfStale('leads_form_templates', data.formTemplates, requestStartedAt);
      hydrateIfStale('leads_form_submissions', data.submissions, requestStartedAt);
      hydrateIfStale('leads_designs', data.designs, requestStartedAt);
      hydrateIfStale('leads_group_policies', data.groupPolicies, requestStartedAt);
      hydrateIfStale('leads_access_level_settings', data.accessLevelSettings, requestStartedAt);
      hydrateIfStale('leads_system_settings', data.systemSettings, requestStartedAt);
      hydrateIfStale('leads_guests', data.guests, requestStartedAt);
      hydrateIfStale('leads_budgets', data.budgets, requestStartedAt);
      hydrateIfStale('leads_audit_logs', data.auditLogs, requestStartedAt);
      // Notify every open page in this tab to re-read localStorage and re-render.
      // The native 'storage' event only fires in OTHER tabs/windows — it never
      // fires in the tab that made the write, so this custom event is the only
      // signal same-tab pages get that a poll just pulled in fresh server data.
      window.dispatchEvent(new Event('leads-data-sync'));
      return true;
    }
  } catch (err) {
    console.warn('[sync] Server sync skipped (offline or starting up):', err);
  }
  return false;
}

/**
 * Fire-and-forget helper for targeted per-collection server calls.
 * Does NOT send the entire database — only touches the one record that changed.
 */
async function serverPost(endpoint: string, body: any): Promise<any> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.warn(`[api] POST ${endpoint} failed:`, res.status);
    return res.ok ? res.json() : null;
  } catch (err) {
    console.warn(`[api] POST ${endpoint} error:`, err);
    return null;
  }
}

async function serverPatch(endpoint: string, id: string, updates: any): Promise<any> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`${endpoint}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) console.warn(`[api] PATCH ${endpoint}/${id} failed:`, res.status);
    return res.ok ? res.json() : null;
  } catch (err) {
    console.warn(`[api] PATCH ${endpoint}/${id} error:`, err);
    return null;
  }
}

async function serverDelete(endpoint: string, id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    if (!res.ok) console.warn(`[api] DELETE ${endpoint}/${id} failed:`, res.status);
    return res.ok;
  } catch (err) {
    console.warn(`[api] DELETE ${endpoint}/${id} error:`, err);
    return false;
  }
}

// -------------------------------------------------------------
// Storage & Accessors
// -------------------------------------------------------------

export function getMembers(): Member[] {
  if (typeof window === 'undefined') return initialMembers;
  const saved = localStorage.getItem('leads_members');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const REMOVED_IDS = new Set(['m5', 'm6', 'm8', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18', 'm19', 'm20', 'm21', 'm22', 'm23', 'm24', 'm25', 'm26', 'm27', 'm28', 'm29', 'm30', 'm31', 'm32', 'm33', 'm34', 'm35']);
        const filtered = parsed.filter((m: any) => !REMOVED_IDS.has(m?.id)).map((m: any) => {
          if (!m.division) {
            if (m.tier <= 4) m.division = 'Faculty';
            else if (m.tier === 5) m.division = 'Core Committee';
            else if (m.tier === 7) m.division = 'Alumni';
            else m.division = 'Training Associate';
          }
          if (['m2', 'm3', 'm4', 'm7', 'm10', 'm11', 'm12'].includes(m?.id)) {
            m.division = 'Faculty';
          }
          return m;
        });
        if (filtered.length < parsed.length) {
          localStorage.setItem('leads_members', JSON.stringify(filtered));
        }
        return filtered;
      }
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  // syncWithServer() will seed properly on mount
  return initialMembers;
}

export function saveMembers(members: Member[]): void {
  if (typeof window === 'undefined') return;
  // Security Fail-Safe: Ensure at least one Super User account exists in the roster at all times
  const hasSuperUser = members.some(m => m.id === 'm1' || m.tier === 1 || m.role === 'Super User');
  if (!hasSuperUser) {
    const defaultSuperUser: Member = initialMembers[0] || {
      id: 'm1',
      name: 'Kayomarz Pavri',
      email: 'kayo2970@gmail.com',
      role: 'Super User',
      tier: 1,
      division: 'Core Committee',
      department: 'Design and Social Media',
      status: 'Active',
    };
    members.unshift(defaultSuperUser);
  }
  localStorage.setItem('leads_members', JSON.stringify(members));
  markLocalWrite('leads_members');
  // Note: Mutations call targeted per-member endpoints (/api/members, /api/members/[id])
}

export function addMember(member: Omit<Member, 'id'>): Member {
  const current = getMembers();
  const existing = current.find(m => m.email.toLowerCase() === member.email.toLowerCase());
  if (existing) {
    throw new Error(`A member with email ${member.email} already exists in the roster.`);
  }

  const newMember: Member = {
    ...member,
    mustSetupPassword: true,
    id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
  };
  current.push(newMember);
  saveMembers(current);
  serverPost('/api/members', newMember);
  logAuditEvent('MEMBER_ADDED', 'System / Admin', `Added member ${newMember.name} to ${newMember.division}`);
  return newMember;
}

export function deleteMember(id: string): void {
  const current = getMembers();
  const target = current.find(m => m.id === id);
  if (!target) return;
  if (id === 'm1' || target.tier === 1 || target.role === 'Super User') {
    throw new Error('The Super User account is protected and cannot be deleted.');
  }

  const updated = current.filter(m => m.id !== id);
  saveMembers(updated);
  serverDelete('/api/members', id);
  logAuditEvent('MEMBER_DELETED', 'System / Admin', `Removed member ${target.name} (${target.email})`);
}

export function syncActiveSessionUser(member: Member): void {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem('user');
  if (!saved) return;
  try {
    const activeUser = JSON.parse(saved);
    const isTarget =
      (activeUser.id && activeUser.id === member.id) ||
      (activeUser.email && activeUser.email.toLowerCase() === member.email.toLowerCase());
    if (isTarget) {
      const updatedSessionUser = {
        ...activeUser,
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        tier: member.tier,
        division: member.division,
        department: member.department,
        program: member.program,
        batch: member.batch,
        avatarUrl: member.avatarUrl,
        dateOfBirth: member.dateOfBirth,
        bankName: member.bankName,
        accountNumber: member.accountNumber,
        ifscCode: member.ifscCode,
      };
      delete (updatedSessionUser as any).passwordHash;
      localStorage.setItem('user', JSON.stringify(updatedSessionUser));
      window.dispatchEvent(new Event('leads-data-sync'));
    }
  } catch (e) {
    console.error('Failed to sync active session user:', e);
  }
}

export function bulkUpdateMembers(
  ids: string[],
  updates: Partial<Pick<Member, 'division' | 'role' | 'batch' | 'tier'>>,
  actorName: string
): Member[] {
  const current = getMembers();
  const targetIdSet = new Set(ids);
  let updatedCount = 0;

  const updated = current.map(m => {
    if (targetIdSet.has(m.id)) {
      updatedCount++;
      const next = { ...m, ...updates };
      // Security Fail-Safe: Protect Super User status and tier
      if (m.id === 'm1' || m.tier === 1 || m.role === 'Super User') {
        next.tier = 1;
        next.role = 'Super User';
        next.status = 'Active';
      }
      return next;
    }
    return m;
  });

  saveMembers(updated);
  // Bulk: patch each member individually with its full merged record (not just the
  // diff) so a member that only ever existed as bundled sample data gets a complete,
  // non-corrupt row if the server has to upsert it.
  ids.forEach(id => {
    const full = updated.find(m => m.id === id);
    if (full) {
      serverPatch('/api/members', id, full);
      syncActiveSessionUser(full);
    }
  });
  const changeSummary = Object.entries(updates)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}='${v}'`)
    .join(', ');
  logAuditEvent('BULK_MEMBERS_UPDATED', actorName, `Bulk updated ${updatedCount} members with: ${changeSummary}`);
  return updated;
}

export function bulkDeleteMembers(ids: string[], actorName: string): Member[] {
  const current = getMembers();
  const targetIdSet = new Set(ids);
  // Protect super user m1 and any Super User
  targetIdSet.delete('m1');
  current.filter(m => m.tier === 1 || m.role === 'Super User').forEach(m => targetIdSet.delete(m.id));

  const updated = current.filter(m => !targetIdSet.has(m.id));
  saveMembers(updated);
  Array.from(targetIdSet).forEach(id => serverDelete('/api/members', id));
  logAuditEvent('BULK_MEMBERS_DELETED', actorName, `Bulk removed ${current.length - updated.length} members`);
  return updated;
}

export function updateMember(id: string, updates: Partial<Member>, actorName: string): Member | null {
  const current = getMembers();
  const idx = current.findIndex(m => m.id === id);
  if (idx === -1) return null;

  const isSuperUser = id === 'm1' || current[idx].tier === 1 || current[idx].role === 'Super User';
  const finalUpdates = { ...updates };
  // Security Fail-Safe: Super User ALWAYS remains Super User (tier 1, Active)
  if (isSuperUser) {
    finalUpdates.role = 'Super User';
    finalUpdates.tier = 1;
    finalUpdates.status = 'Active';
  }

  current[idx] = { ...current[idx], ...finalUpdates };
  saveMembers(current);
  // Send the full merged member, not just the diff, so a server-side upsert (a
  // client-only sample member that was never POSTed) creates a complete record.
  serverPatch('/api/members', id, current[idx]);
  syncActiveSessionUser(current[idx]);
  logAuditEvent('MEMBER_UPDATED', actorName, `Updated member details for ${current[idx].name}`);
  return current[idx];
}

/**
 * Revoke a member's dashboard access without deleting them — every historical
 * record (tasks, ratings, reimbursements, event committees, audit log) keeps
 * referencing this member by id/name/email exactly as before, since none of
 * those are live foreign keys. Login is blocked server-side in /api/auth/login.
 */
export function terminateMember(id: string, actorName: string): Member | null {
  const current = getMembers();
  const idx = current.findIndex(m => m.id === id);
  if (idx === -1) return null;
  if (id === 'm1' || current[idx].tier === 1 || current[idx].role === 'Super User') {
    throw new Error('The Super User account is protected and cannot be terminated.');
  }

  current[idx] = {
    ...current[idx],
    status: 'Terminated',
    terminatedAt: new Date().toISOString(),
    terminatedBy: actorName,
  };
  saveMembers(current);
  serverPatch('/api/members', id, current[idx]);
  logAuditEvent(
    'MEMBER_TERMINATED',
    actorName,
    `Terminated ${current[idx].name} (${current[idx].email}) — dashboard access revoked, historical records retained`,
    current[idx].email
  );
  return current[idx];
}

/** Restore a terminated member's dashboard access. */
export function reactivateMember(id: string, actorName: string): Member | null {
  const current = getMembers();
  const idx = current.findIndex(m => m.id === id);
  if (idx === -1) return null;

  current[idx] = {
    ...current[idx],
    status: 'Active',
    terminatedAt: undefined,
    terminatedBy: undefined,
  };
  saveMembers(current);
  serverPatch('/api/members', id, current[idx]);
  logAuditEvent(
    'MEMBER_REACTIVATED',
    actorName,
    `Reactivated ${current[idx].name} (${current[idx].email}) — dashboard access restored`,
    current[idx].email
  );
  return current[idx];
}

// -------------------------------------------------------------
// Guest Directory (visiting-card contacts — separate from Members)
// -------------------------------------------------------------

export function getGuests(): Guest[] {
  if (typeof window === 'undefined') return initialGuests;
  const saved = localStorage.getItem('leads_guests');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return initialGuests;
}

export function saveGuests(guests: Guest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_guests', JSON.stringify(guests));
  markLocalWrite('leads_guests');
}

export function addGuest(guest: Omit<Guest, 'id' | 'createdAt'>, actorName: string): Guest {
  const current = getGuests();
  const newGuest: Guest = {
    ...guest,
    id: 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    createdAt: new Date().toISOString(),
  };
  current.unshift(newGuest);
  saveGuests(current);
  // The server converts visitingCardData (base64) to a real file on disk and
  // returns storageKey/visitingCardUrl — the next syncWithServer() poll picks
  // that up, same fire-and-forget pattern as designs/addDesign.
  serverPost('/api/guests', newGuest);
  logAuditEvent('GUEST_ADDED', actorName, `Added guest "${newGuest.name}"${newGuest.organization ? ` (${newGuest.organization})` : ''} to the Guest Directory`);
  return newGuest;
}

export function updateGuest(id: string, updates: Partial<Guest>, actorName: string): Guest | null {
  const current = getGuests();
  const idx = current.findIndex(g => g.id === id);
  if (idx === -1) return null;

  current[idx] = { ...current[idx], ...updates };
  saveGuests(current);
  serverPatch('/api/guests', id, current[idx]);
  logAuditEvent('GUEST_UPDATED', actorName, `Updated guest record for "${current[idx].name}"`);
  return current[idx];
}

export function deleteGuest(id: string, actorName: string): void {
  const current = getGuests();
  const target = current.find(g => g.id === id);
  if (!target) return;

  const updated = current.filter(g => g.id !== id);
  saveGuests(updated);
  serverDelete('/api/guests', id);
  logAuditEvent('GUEST_DELETED', actorName, `Removed guest "${target.name}" from the Guest Directory`);
}

// -------------------------------------------------------------
// Events
// -------------------------------------------------------------

export function getEvents(): EventItem[] {
  if (typeof window === 'undefined') return initialEvents;
  const saved = localStorage.getItem('leads_events');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure committees array exists
      return parsed.map((e: any) => ({
        ...e,
        committees: Array.isArray(e.committees) ? e.committees : []
      }));
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialEvents;
}

export function getEventById(id: string): EventItem | null {
  const events = getEvents();
  return events.find(e => e.id === id) || null;
}

export function saveEvents(events: EventItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_events', JSON.stringify(events));
  markLocalWrite('leads_events');
  // Individual mutations use targeted serverPost/serverPatch/serverDelete
}

export function addEvent(event: Omit<EventItem, 'id' | 'committees'> & { committees?: EventCommittee[] }): EventItem {
  const events = getEvents();
  const newEvent: EventItem = {
    ...event,
    id: 'e_' + Date.now(),
    committees: event.committees || []
  };
  events.unshift(newEvent);
  saveEvents(events);
  serverPost('/api/events', newEvent);
  logAuditEvent('EVENT_CREATED', event.createdBy || 'User', `Created new event: ${newEvent.title}`);
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<EventItem>, actorName: string): EventItem | null {
  const events = getEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return null;

  events[idx] = { ...events[idx], ...updates };
  saveEvents(events);
  // Send the full merged event, not just the diff, so a server-side upsert (a
  // client-only sample event that was never POSTed) creates a complete record.
  serverPatch('/api/events', id, events[idx]);
  logAuditEvent('EVENT_UPDATED', actorName, `Updated event: ${events[idx].title}`);
  return events[idx];
}

export function deleteEvent(id: string, actorName: string): boolean {
  const events = getEvents();
  const target = events.find(e => e.id === id);
  if (!target) return false;

  const updated = events.filter(e => e.id !== id);
  saveEvents(updated);
  serverDelete('/api/events', id);
  logAuditEvent('EVENT_DELETED', actorName, `Deleted event: ${target.title}`);
  return true;
}

/**
 * Submit an edit to an already-approved event for sign-off instead of applying it
 * immediately — used when the editor's EVENTS_EDIT grant came from an
 * approval-required Group Policy. The event keeps showing its last-approved values
 * to everyone else until the change is approved (merged in) or rejected (discarded).
 */
export function submitEventEdit(
  id: string,
  changes: Partial<EventItem>,
  submittedBy: string,
  submittedByEmail: string,
  approval: { approverType?: GroupPolicy['approverType']; approverMemberId?: string; approverPolicyTagId?: string; policyName?: string }
): EventItem | null {
  const events = getEvents();
  const target = events.find(e => e.id === id);
  if (!target) return null;

  const result = updateEvent(id, {
    pendingChange: changes,
    approvalStatus: 'pending_edit',
    approverType: approval.approverType,
    approverMemberId: approval.approverMemberId,
    approverPolicyTagId: approval.approverPolicyTagId,
    approvalPolicyName: approval.policyName,
    submittedBy,
    submittedByEmail,
  }, submittedBy);
  logAuditEvent('EVENT_EDIT_SUBMITTED', submittedBy, `Submitted an edit to event "${target.title}" for approval`, submittedByEmail);
  return result;
}

/** Approve a pending event creation or edit. For a pending edit, merges the staged
 *  pendingChange into the record; for a pending creation, simply marks it approved. */
export function approveEvent(id: string, actorName: string): EventItem | null {
  const events = getEvents();
  const target = events.find(e => e.id === id);
  if (!target) return null;

  const isEdit = target.approvalStatus === 'pending_edit';
  const result = updateEvent(id, {
    ...(isEdit ? target.pendingChange : {}),
    approvalStatus: 'approved',
    pendingChange: undefined,
    decidedBy: actorName,
    decidedAt: new Date().toISOString(),
  }, actorName);
  logAuditEvent('EVENT_APPROVED', actorName, `Approved ${isEdit ? 'an edit to' : 'the creation of'} event "${target.title}"`);
  return result;
}

/** Reject a pending event creation or edit. A rejected creation is marked
 *  'rejected' (kept for audit, hidden from general view). A rejected edit simply
 *  discards the staged pendingChange — the original approved event stands. */
export function rejectEvent(id: string, actorName: string, reason?: string): EventItem | null {
  const events = getEvents();
  const target = events.find(e => e.id === id);
  if (!target) return null;

  const isEdit = target.approvalStatus === 'pending_edit';
  const result = updateEvent(id, {
    approvalStatus: isEdit ? 'approved' : 'rejected',
    pendingChange: undefined,
    decidedBy: actorName,
    decidedAt: new Date().toISOString(),
    rejectionReason: reason,
  }, actorName);
  logAuditEvent('EVENT_REJECTED', actorName, `Rejected ${isEdit ? 'an edit to' : 'the creation of'} event "${target.title}"${reason ? `: ${reason}` : ''}`);
  return result;
}

/** Human-readable date range for an event, honoring a "dates to be decided" placeholder. */
export function formatEventDateRange(event: Pick<EventItem, 'startDate' | 'endDate' | 'datesTBD'>): string {
  if (event.datesTBD || !event.startDate || !event.endDate) return 'Dates To Be Decided';
  return event.startDate === event.endDate ? event.startDate : `${event.startDate} – ${event.endDate}`;
}

/**
 * Sort key for an event's start date, pushing "dates to be decided" events to
 * the end of a chronological sort instead of letting `new Date('').getTime()`
 * (NaN) produce an unstable order.
 */
export function getEventSortTime(event: Pick<EventItem, 'startDate' | 'datesTBD'>): number {
  if (event.datesTBD || !event.startDate) return Number.MAX_SAFE_INTEGER;
  return new Date(event.startDate).getTime();
}

/**
 * An event's stored `status` is set manually (planned/active/completed/archived),
 * but nothing ever moved it to "completed" once its end date passed — it just sat
 * as "planned"/"active" forever. This derives the status that should actually be
 * shown/filtered on: past its end date, treat it as completed, unless someone has
 * deliberately archived it (archiving always wins, it's a manual terminal state) —
 * or unless a task tied to this event is still open OR has been completed but not
 * yet rated, in which case the event stays whatever its stored status is instead
 * of silently completing with loose ends. A task counts as "rated" once it carries
 * `ratedAt` — for committee/group tasks a single evaluation submission propagates
 * to every member (see propagateCommitteeRating/propagateGroupRating), so that one
 * `ratedAt` timestamp already means everyone who worked on it has been reviewed.
 * `tasks` defaults to a fresh getTasks() read when the caller doesn't already have
 * a copy on hand.
 */
export function getEffectiveEventStatus(event: EventItem, tasks?: TaskItem[]): EventItem['status'] {
  if (event.status === 'archived') return 'archived';
  const today = new Date().toISOString().split('T')[0];
  if (event.endDate && event.endDate < today) {
    const relevantTasks = (tasks ?? getTasks()).filter(t => t.eventId === event.id);
    const hasPendingTask = relevantTasks.some(t => t.status !== 'Completed');
    if (hasPendingTask) return event.status;
    const hasUnratedTask = relevantTasks.some(t => !t.ratedAt);
    if (hasUnratedTask) return event.status;
    return 'completed';
  }
  return event.status;
}

export function addEventCommittee(eventId: string, committeeName: string, actorName: string): EventItem | null {
  const events = getEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) return null;

  const newComm: EventCommittee = {
    id: 'comm_' + Date.now(),
    name: committeeName,
    memberIds: []
  };
  event.committees.push(newComm);
  saveEvents(events);
  // Committees are nested in event — patch the whole event object (full record,
  // so a server-side upsert of a client-only sample event stays complete).
  serverPatch('/api/events', eventId, event);
  logAuditEvent('EVENT_COMMITTEE_ADDED', actorName, `Added committee "${committeeName}" to event "${event.title}"`);
  return event;
}

export function updateEventCommitteeMembers(eventId: string, committeeId: string, memberIds: string[], actorName: string): EventItem | null {
  const events = getEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) return null;

  const comm = event.committees.find(c => c.id === committeeId);
  if (!comm) return null;

  comm.memberIds = memberIds;
  saveEvents(events);
  serverPatch('/api/events', eventId, event);
  logAuditEvent('EVENT_COMMITTEE_UPDATED', actorName, `Updated member assignments for committee "${comm.name}" in event "${event.title}"`);
  return event;
}

export function deleteEventCommittee(eventId: string, committeeId: string, actorName: string): EventItem | null {
  const events = getEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) return null;

  event.committees = event.committees.filter(c => c.id !== committeeId);
  saveEvents(events);
  serverPatch('/api/events', eventId, event);
  logAuditEvent('EVENT_COMMITTEE_DELETED', actorName, `Removed committee from event "${event.title}"`);
  return event;
}

export function getEventCommittees(eventId?: string): EventCommittee[] {
  const events = getEvents();
  if (eventId) {
    const event = events.find(e => e.id === eventId);
    return event?.committees || [];
  }
  return events.flatMap(e => e.committees || []);
}

export function getCommittees(eventId?: string): string[] {
  const committees = getEventCommittees(eventId);
  const names = new Set<string>();
  committees.forEach(c => {
    if (c.name) names.add(c.name);
  });
  if (names.size === 0) {
    return ['Logistics & Venue Committee', 'Technical & AV Committee', 'Design & Media Committee'];
  }
  return Array.from(names);
}

// -------------------------------------------------------------
// Tasks & Visibility Rule
// -------------------------------------------------------------

export function getTasks(): TaskItem[] {
  if (typeof window === 'undefined') return initialTasks;
  const saved = localStorage.getItem('leads_tasks');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialTasks;
}

export function saveTasks(tasks: TaskItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_tasks', JSON.stringify(tasks));
  markLocalWrite('leads_tasks');
}

export function addTask(task: Omit<TaskItem, 'id' | 'status'> & { status?: TaskItem['status'] }): TaskItem {
  const tasks = getTasks();
  const newTask: TaskItem = {
    ...task,
    id: 't_' + Date.now(),
    status: task.status || 'Assigned'
  };
  tasks.unshift(newTask);
  saveTasks(tasks);
  serverPost('/api/tasks', newTask);
  logAuditEvent('TASK_CREATED', task.creatorName || 'User', `Assigned task: ${newTask.title} to ${newTask.assignee}`);
  return newTask;
}

export function updateTask(id: string, updates: Partial<TaskItem>, actorName: string): TaskItem | null {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;

  tasks[idx] = { ...tasks[idx], ...updates };
  saveTasks(tasks);
  // Send the full merged task, not just the diff, so a server-side upsert (a
  // client-only sample task that was never POSTed) creates a complete record.
  serverPatch('/api/tasks', id, tasks[idx]);
  logAuditEvent('TASK_UPDATED', actorName, `Updated task: ${tasks[idx].title}`);
  return tasks[idx];
}

export function updateTaskStatus(id: string, status: TaskItem['status'], actorName?: string): TaskItem | null {
  return updateTask(id, { status }, actorName || 'User');
}

export function deleteTask(id: string, actorName: string): boolean {
  const tasks = getTasks();
  const target = tasks.find(t => t.id === id);
  if (!target) return false;

  const updated = tasks.filter(t => t.id !== id);
  saveTasks(updated);
  serverDelete('/api/tasks', id);
  logAuditEvent('TASK_DELETED', actorName, `Deleted task: ${target.title}`);
  return true;
}

export function canViewTask(
  task: TaskItem, 
  user: { id?: string; name: string; email: string; tier: number; division?: string; committee?: string } | null
): boolean {
  if (!user) return false;
  // Tier 1-3 (Super User, Centre Head, Head of Events): see all tasks
  if (user.tier <= 3) return true;
  // Tier 4 (Advisory Board): strategic read-only oversight
  if (user.tier === 4) return true;

  if (task.assigneeType === 'committee') {
    // Check if user's legacy committee field matches committee name
    if (user.committee && (
      user.committee.toLowerCase() === (task.assignee || '').toLowerCase() ||
      user.committee.toLowerCase() === (task.eventCommitteeName || '').toLowerCase()
    )) {
      return true;
    }

    // Check if user's member ID is assigned to the event committee
    const memberId = user.id || getMembers().find(m => m.email.toLowerCase() === user.email.toLowerCase())?.id;
    if (memberId) {
      const events = getEvents();
      const targetEvents = task.eventId ? events.filter(e => e.id === task.eventId) : events;
      const isMember = targetEvents.some(e =>
        e.committees.some(c =>
          (c.id === task.eventCommitteeId || c.name.toLowerCase() === (task.assignee || '').toLowerCase()) &&
          (c.memberIds.includes(memberId) || c.leadMemberId === memberId)
        )
      );
      if (isMember) return true;
    }
    return false;
  }

  // Tier 5-6 (Core Committee, Training Associate): see their assigned individual tasks
  return Boolean(
    (task.assignee && task.assignee.toLowerCase() === user.name.toLowerCase()) ||
    (task.assigneeEmail && task.assigneeEmail.toLowerCase() === user.email.toLowerCase()) ||
    (task.assigneeId && task.assigneeId === (user as any).id)
  );
}

// -------------------------------------------------------------
// Ratings (Tied to Task Performance)
// -------------------------------------------------------------

export function getRatings(): RatingItem[] {
  if (typeof window === 'undefined') return initialRatings;
  const saved = localStorage.getItem('leads_ratings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialRatings;
}

export function saveRatings(ratings: RatingItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_ratings', JSON.stringify(ratings));
  markLocalWrite('leads_ratings');
}

function propagateCommitteeRating(task: TaskItem, parentRating: RatingItem): void {
  const events = getEvents();
  const event = events.find(e => e.id === task.eventId || e.title === task.event);
  if (!event) {
    console.warn(`[propagateCommitteeRating] No linked event found for committee task "${task.title}" — no student ratings were created.`);
    return;
  }

  const committee = (event.committees || []).find(
    c => c.id === task.eventCommitteeId || c.name.toLowerCase() === task.assignee.toLowerCase()
  );
  if (!committee || !committee.memberIds || committee.memberIds.length === 0) {
    console.warn(`[propagateCommitteeRating] No matching committee with members found for task "${task.title}" (eventCommitteeId: ${task.eventCommitteeId || 'unset'}) — no student ratings were created.`);
    return;
  }

  const members = getMembers();
  const ratings = getRatings();
  let updated = false;

  committee.memberIds.forEach(mId => {
    const memberObj = members.find(m => m.id === mId || m.name.toLowerCase() === mId.toLowerCase());
    if (!memberObj) return;

    const alreadyRated = ratings.some(r => r.taskId === task.id && (r.targetId === memberObj.id || r.targetName.toLowerCase() === memberObj.name.toLowerCase()));
    if (alreadyRated) return;

    const studentRating: RatingItem = {
      id: 'r_comm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      taskId: task.id,
      taskTitle: task.title,
      eventId: task.eventId,
      eventName: task.event,
      targetId: memberObj.id,
      targetName: memberObj.name,
      raterName: parentRating.raterName,
      quality: parentRating.quality,
      timeliness: parentRating.timeliness,
      initiative: parentRating.initiative,
      collaboration: parentRating.collaboration,
      overallScore: parentRating.overallScore,
      notes: `[Committee Evaluation: ${committee.name}] ${parentRating.notes || ''}`.trim(),
      createdAt: parentRating.createdAt
    };
    ratings.unshift(studentRating);
    serverPost('/api/ratings', studentRating);
    updated = true;
  });

  if (updated) {
    saveRatings(ratings);
  }
}

/**
 * Same fan-out as propagateCommitteeRating, but for an ad-hoc 'group' task —
 * there's no EventCommittee to look up, just the assigneeIds already stored
 * directly on the task.
 */
function propagateGroupRating(task: TaskItem, parentRating: RatingItem): void {
  if (!task.assigneeIds || task.assigneeIds.length === 0) return;

  const members = getMembers();
  const ratings = getRatings();
  let updated = false;

  task.assigneeIds.forEach(mId => {
    const memberObj = members.find(m => m.id === mId);
    if (!memberObj) return;

    const alreadyRated = ratings.some(r => r.taskId === task.id && r.targetId === memberObj.id);
    if (alreadyRated) return;

    const studentRating: RatingItem = {
      id: 'r_group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      taskId: task.id,
      taskTitle: task.title,
      eventId: task.eventId,
      eventName: task.event,
      targetId: memberObj.id,
      targetName: memberObj.name,
      raterName: parentRating.raterName,
      quality: parentRating.quality,
      timeliness: parentRating.timeliness,
      initiative: parentRating.initiative,
      collaboration: parentRating.collaboration,
      overallScore: parentRating.overallScore,
      notes: `[Group Evaluation] ${parentRating.notes || ''}`.trim(),
      createdAt: parentRating.createdAt
    };
    ratings.unshift(studentRating);
    serverPost('/api/ratings', studentRating);
    updated = true;
  });

  if (updated) {
    saveRatings(ratings);
  }
}

export function addRating(rating: Omit<RatingItem, 'id' | 'createdAt'>): RatingItem {
  const ratings = getRatings();
  const newRating: RatingItem = {
    ...rating,
    id: 'r_' + Date.now(),
    createdAt: new Date().toISOString().split('T')[0]
  };
  ratings.unshift(newRating);
  saveRatings(ratings);
  serverPost('/api/ratings', newRating);

  // Update task with rating metadata
  if (rating.taskId) {
    updateTask(rating.taskId, { ratingScore: rating.overallScore, ratedAt: newRating.createdAt }, rating.raterName);

    const task = getTasks().find(t => t.id === rating.taskId);
    if (task && (task.assigneeType === 'committee' || task.eventCommitteeId)) {
      propagateCommitteeRating(task, newRating);
    } else if (task && task.assigneeType === 'group') {
      propagateGroupRating(task, newRating);
    }
  }

  logAuditEvent('RATING_SUBMITTED', rating.raterName, `Evaluated task performance (${rating.overallScore}/5.0) for ${rating.targetName} on "${rating.taskTitle}"`);
  return newRating;
}

export function updateRating(id: string, updates: Partial<RatingItem>, actorName: string): RatingItem | null {
  const ratings = getRatings();
  const idx = ratings.findIndex(r => r.id === id);
  if (idx === -1) return null;

  ratings[idx] = {
    ...ratings[idx],
    ...updates,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  saveRatings(ratings);
  // Send the full merged rating, not just the diff, so a server-side upsert (a
  // client-only sample rating that was never POSTed) creates a complete record.
  serverPatch('/api/ratings', id, ratings[idx]);

  if (ratings[idx].taskId && updates.overallScore) {
    updateTask(ratings[idx].taskId, { ratingScore: updates.overallScore }, actorName);
  }

  logAuditEvent('RATING_UPDATED', actorName, `Updated evaluation scorecard for ${ratings[idx].targetName}`);
  return ratings[idx];
}

export function deleteRating(id: string, actorName: string): boolean {
  const ratings = getRatings();
  const target = ratings.find(r => r.id === id);
  if (!target) return false;

  const updated = ratings.filter(r => r.id !== id);
  saveRatings(updated);
  serverDelete('/api/ratings', id);
  logAuditEvent('RATING_DELETED', actorName, `Deleted rating record for ${target.targetName}`);
  return true;
}

// -------------------------------------------------------------
// Student Profiles & Individual Outcomes Aggregation
// -------------------------------------------------------------

export interface StudentProfileData {
  member: Member;
  assignedEvents: { event: EventItem; committee: EventCommittee }[];
  tasks: TaskItem[];
  ratings: RatingItem[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageRating: number;
    qualityAvg: number;
    timelinessAvg: number;
    initiativeAvg: number;
    collaborationAvg: number;
    totalEvents: number;
  };
}

export function getStudentProfile(memberIdOrName: string): StudentProfileData | null {
  const members = getMembers();
  const member = members.find(m => m.id === memberIdOrName || m.name.toLowerCase() === memberIdOrName.toLowerCase());
  if (!member) return null;

  const events = getEvents();
  const assignedEvents: { event: EventItem; committee: EventCommittee }[] = [];
  events.forEach(event => {
    (event.committees || []).forEach(comm => {
      if (comm.memberIds.includes(member.id) || comm.memberIds.includes(member.name)) {
        assignedEvents.push({ event, committee: comm });
      }
    });
  });

  const allTasks = getTasks();
  const memberTasks = allTasks.filter(t => {
    if (t.assigneeId === member.id || t.assignee.toLowerCase() === member.name.toLowerCase()) return true;
    if (member.email && t.assigneeEmail && t.assigneeEmail.toLowerCase() === member.email.toLowerCase()) return true;
    if (t.assigneeType === 'committee' || t.eventCommitteeId) {
      return assignedEvents.some(ae =>
        ae.committee.id === t.eventCommitteeId ||
        ae.committee.name.toLowerCase() === t.assignee.toLowerCase()
      );
    }
    return false;
  });

  const allRatings = getRatings();
  const memberRatings = allRatings.filter(r =>
    r.targetId === member.id ||
    r.targetName.toLowerCase() === member.name.toLowerCase()
  );

  const totalTasks = memberTasks.length;
  const completedTasks = memberTasks.filter(t => t.status === 'Completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let qualitySum = 0, timelinessSum = 0, initiativeSum = 0, collaborationSum = 0, overallSum = 0;
  memberRatings.forEach(r => {
    qualitySum += r.quality;
    timelinessSum += r.timeliness;
    initiativeSum += r.initiative;
    collaborationSum += r.collaboration;
    overallSum += r.overallScore;
  });

  const ratingCount = memberRatings.length;
  const averageRating = ratingCount > 0 ? parseFloat((overallSum / ratingCount).toFixed(1)) : 0;
  const qualityAvg = ratingCount > 0 ? parseFloat((qualitySum / ratingCount).toFixed(1)) : 0;
  const timelinessAvg = ratingCount > 0 ? parseFloat((timelinessSum / ratingCount).toFixed(1)) : 0;
  const initiativeAvg = ratingCount > 0 ? parseFloat((initiativeSum / ratingCount).toFixed(1)) : 0;
  const collaborationAvg = ratingCount > 0 ? parseFloat((collaborationSum / ratingCount).toFixed(1)) : 0;

  return {
    member,
    assignedEvents,
    tasks: memberTasks,
    ratings: memberRatings,
    stats: {
      totalTasks,
      completedTasks,
      completionRate,
      averageRating,
      qualityAvg,
      timelinessAvg,
      initiativeAvg,
      collaborationAvg,
      totalEvents: assignedEvents.length
    }
  };
}

export function getStudentLeaderboard(): {
  id: string;
  name: string;
  role: string;
  division: string;
  score: number;
  completedTasks: number;
  totalTasks: number;
  ratingsCount: number;
}[] {
  const members = getMembers();
  // Filter for student contributors: Core Committee, Training Associates, Alumni
  const studentMembers = members.filter(m => m.division !== 'Advisory Board' && m.tier >= 5);

  const results = studentMembers.map(m => {
    const profile = getStudentProfile(m.id);
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      division: m.division,
      score: profile?.stats.averageRating || 0,
      completedTasks: profile?.stats.completedTasks || 0,
      totalTasks: profile?.stats.totalTasks || 0,
      ratingsCount: profile?.ratings.length || 0,
    };
  });

  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.completedTasks - a.completedTasks;
  });
}

// -------------------------------------------------------------
// Reimbursements (Two-Stage Approval)
// -------------------------------------------------------------

export function getReimbursements(): ReimbursementItem[] {
  if (typeof window === 'undefined') return initialReimbursements;
  const saved = localStorage.getItem('leads_reimbursements');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialReimbursements;
}

export function saveReimbursements(reimbursements: ReimbursementItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_reimbursements', JSON.stringify(reimbursements));
  markLocalWrite('leads_reimbursements');
}

export function addReimbursement(item: Omit<ReimbursementItem, 'id' | 'status' | 'submittedAt'>): ReimbursementItem {
  const current = getReimbursements();
  const newClaim: ReimbursementItem = {
    ...item,
    id: 'rem_' + Date.now(),
    status: 'Pending',
    submittedAt: new Date().toISOString().split('T')[0]
  };
  current.unshift(newClaim);
  saveReimbursements(current);
  serverPost('/api/reimbursements', newClaim);
  logAuditEvent('REIMBURSEMENT_CLAIMED', item.memberName, `Submitted expense claim of ₹${item.amount} under ${item.category}`);
  return newClaim;
}

export function updateReimbursementStatus(
  id: string,
  status: ReimbursementItem['status'],
  reviewerInfo?: { name: string; stage?: 'firstPass' | 'final'; tier?: number }
): ReimbursementItem | null {
  const current = getReimbursements();
  const idx = current.findIndex(r => r.id === id);
  if (idx === -1) return null;

  const claim = current[idx];
  claim.status = status;
  claim.decidedAt = new Date().toISOString().split('T')[0];

  if (reviewerInfo) {
    const effectiveStage = reviewerInfo.tier !== undefined
      ? (reviewerInfo.tier <= 3 ? 'final' : 'firstPass')
      : (reviewerInfo.stage || 'final');

    if (effectiveStage === 'firstPass') {
      claim.firstPassReviewer = reviewerInfo.name;
    } else {
      claim.finalApprover = reviewerInfo.name;
    }
    logAuditEvent('REIMBURSEMENT_STATUS_UPDATED', reviewerInfo.name, `Updated claim #${claim.id} status to "${status}" (${effectiveStage})`);
  }

  saveReimbursements(current);
  serverPatch('/api/reimbursements', id, claim);
  return claim;
}

// -------------------------------------------------------------
// Budgets — Centre Head submits event/monthly requests, Finance Head decides
// -------------------------------------------------------------

export function getBudgets(): BudgetItem[] {
  if (typeof window === 'undefined') return initialBudgets;
  const saved = localStorage.getItem('leads_budgets');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return initialBudgets;
}

export function saveBudgets(budgets: BudgetItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_budgets', JSON.stringify(budgets));
  markLocalWrite('leads_budgets');
}

export function addBudget(item: Omit<BudgetItem, 'id' | 'status' | 'submittedAt'>): BudgetItem {
  const current = getBudgets();
  const newBudget: BudgetItem = {
    ...item,
    id: 'bud_' + Date.now(),
    status: 'Pending',
    submittedAt: new Date().toISOString().split('T')[0],
  };
  current.unshift(newBudget);
  saveBudgets(current);
  serverPost('/api/budgets', newBudget);
  const scopeLabel = item.type === 'event' ? (item.eventName || 'an event') : (item.month || 'a month');
  logAuditEvent('BUDGET_SUBMITTED', item.submittedBy, `Submitted a ₹${item.amount.toLocaleString()} budget request for ${scopeLabel}`, item.submittedByEmail);
  return newBudget;
}

export function decideBudget(
  id: string,
  status: 'Approved' | 'Rejected',
  decidedBy: string,
  decisionNotes?: string
): BudgetItem | null {
  const current = getBudgets();
  const idx = current.findIndex(b => b.id === id);
  if (idx === -1) return null;

  current[idx] = {
    ...current[idx],
    status,
    decidedBy,
    decidedAt: new Date().toISOString().split('T')[0],
    decisionNotes,
  };
  saveBudgets(current);
  serverPatch('/api/budgets', id, current[idx]);
  logAuditEvent('BUDGET_DECIDED', decidedBy, `${status} the ₹${current[idx].amount.toLocaleString()} budget request from ${current[idx].submittedBy}`);
  return current[idx];
}

/**
 * Lets the Centre Head revise their own budget request — before Finance
 * Head has decided, or even after it was already Approved. Either way the
 * edit always resets it to Pending: a changed Approved budget no longer
 * reflects what was actually approved, so it must be re-approved rather
 * than silently keeping its old Approved status with new numbers.
 */
export function updateBudget(id: string, updates: Partial<BudgetItem>, actorName: string): BudgetItem | null {
  const current = getBudgets();
  const idx = current.findIndex(b => b.id === id);
  if (idx === -1) return null;

  const wasApproved = current[idx].status === 'Approved';
  current[idx] = {
    ...current[idx],
    ...updates,
    status: 'Pending',
    decidedBy: undefined,
    decidedAt: undefined,
    decisionNotes: undefined,
  };
  saveBudgets(current);
  serverPatch('/api/budgets', id, current[idx]);
  logAuditEvent(
    'BUDGET_EDITED',
    actorName,
    `Edited a ₹${current[idx].amount.toLocaleString()} budget request${wasApproved ? ' that was previously Approved — now pending re-approval' : ''}`
  );
  return current[idx];
}

export function verifyReimbursementByCentreHead(id: string, reviewerName: string): ReimbursementItem | null {
  const current = getReimbursements();
  const idx = current.findIndex(r => r.id === id);
  if (idx === -1) return null;

  const claim = current[idx];
  const now = new Date().toISOString().split('T')[0];
  claim.status = 'Verified by Centre Head';
  claim.centreHeadVerified = true;
  claim.centreHeadVerifiedBy = reviewerName;
  claim.centreHeadVerifiedAt = now;
  claim.firstPassReviewer = reviewerName;

  saveReimbursements(current);
  serverPatch('/api/reimbursements', id, claim);
  logAuditEvent('REIMBURSEMENT_VERIFIED', reviewerName, `Centre Head verified reimbursement claim of ₹${claim.amount} for ${claim.memberName}`);
  return claim;
}


// -------------------------------------------------------------
// Announcements
// -------------------------------------------------------------

export function getAnnouncements(): AnnouncementItem[] {
  if (typeof window === 'undefined') return initialAnnouncements;
  const saved = localStorage.getItem('leads_announcements');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialAnnouncements;
}

export function saveAnnouncements(announcements: AnnouncementItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_announcements', JSON.stringify(announcements));
  markLocalWrite('leads_announcements');
}

export function addAnnouncement(item: Omit<AnnouncementItem, 'id' | 'publishedAt'>): AnnouncementItem {
  const current = getAnnouncements();
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newAnn: AnnouncementItem = {
    ...item,
    id: 'a_' + Date.now(),
    publishedAt: formattedDate
  };
  current.unshift(newAnn);
  saveAnnouncements(current);
  serverPost('/api/announcements', newAnn);
  logAuditEvent('ANNOUNCEMENT_PUBLISHED', item.authorName, `Published announcement: "${item.title}" [Scope: ${item.scope}]`);
  return newAnn;
}

export function approveAnnouncement(id: string, approverName: string): AnnouncementItem | null {
  const current = getAnnouncements();
  const idx = current.findIndex(a => a.id === id);
  if (idx === -1) return null;

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  current[idx] = {
    ...current[idx],
    status: 'Approved',
    approvedBy: approverName,
    approvedAt: formattedDate,
  };
  saveAnnouncements(current);
  serverPatch('/api/announcements', id, current[idx]);
  logAuditEvent('ANNOUNCEMENT_APPROVED', approverName, `Approved and published announcement: "${current[idx].title}"`);
  return current[idx];
}

export function rejectAnnouncement(id: string, actorName: string): AnnouncementItem | null {
  const current = getAnnouncements();
  const idx = current.findIndex(a => a.id === id);
  if (idx === -1) return null;

  current[idx] = {
    ...current[idx],
    status: 'Rejected',
  };
  saveAnnouncements(current);
  serverPatch('/api/announcements', id, current[idx]);
  logAuditEvent('ANNOUNCEMENT_REJECTED', actorName, `Rejected announcement submission: "${current[idx].title}"`);
  return current[idx];
}

export function updateAnnouncement(id: string, updates: Partial<AnnouncementItem>, actorName: string): AnnouncementItem | null {
  const current = getAnnouncements();
  const idx = current.findIndex(a => a.id === id);
  if (idx === -1) return null;

  const now = new Date();
  current[idx] = {
    ...current[idx],
    ...updates,
    editedAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  };
  saveAnnouncements(current);
  serverPatch('/api/announcements', id, current[idx]);
  logAuditEvent('ANNOUNCEMENT_UPDATED', actorName, `Updated announcement: "${current[idx].title}"`);
  return current[idx];
}

export function deleteAnnouncement(id: string, actorName: string): boolean {
  const current = getAnnouncements();
  const target = current.find(a => a.id === id);
  if (!target) return false;

  const updated = current.filter(a => a.id !== id);
  saveAnnouncements(updated);
  serverDelete('/api/announcements', id);
  logAuditEvent('ANNOUNCEMENT_DELETED', actorName, `Retracted announcement: "${target.title}"`);
  return true;
}

// -------------------------------------------------------------
// Forms & Submissions
// -------------------------------------------------------------

export function getForms(): PublicFormItem[] {
  if (typeof window === 'undefined') return initialForms;
  const saved = localStorage.getItem('leads_custom_forms');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialForms;
}

export function saveForms(forms: PublicFormItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_custom_forms', JSON.stringify(forms));
  markLocalWrite('leads_custom_forms');
}

export function addForm(form: Omit<PublicFormItem, 'id' | 'createdAt'>): PublicFormItem {
  const current = getForms();
  const newForm: PublicFormItem = {
    ...form,
    id: 'form_' + Date.now(),
    createdAt: new Date().toISOString().split('T')[0]
  };
  current.unshift(newForm);
  saveForms(current);
  serverPost('/api/forms', newForm);
  logAuditEvent('FORM_CREATED', form.createdBy, `Created public form "${form.title}" at /forms/${form.slug}`);
  return newForm;
}

export function updateForm(id: string, updates: Partial<PublicFormItem>, actorName: string): PublicFormItem | null {
  const current = getForms();
  const idx = current.findIndex(f => f.id === id);
  if (idx === -1) return null;

  current[idx] = { ...current[idx], ...updates };
  saveForms(current);
  // Send the full merged form, not just the diff, so a server-side upsert (a
  // client-only sample form that was never POSTed) creates a complete record.
  serverPatch('/api/forms', id, current[idx]);
  logAuditEvent('FORM_UPDATED', actorName, `Updated public form "${current[idx].title}"`);
  return current[idx];
}

export function deleteForm(id: string, actorName: string): boolean {
  const current = getForms();
  const target = current.find(f => f.id === id);
  if (!target) return false;

  const updated = current.filter(f => f.id !== id);
  saveForms(updated);
  serverDelete('/api/forms', id);
  logAuditEvent('FORM_DELETED', actorName, `Deleted public form "${target.title}"`);
  return true;
}

export function isSlugUnique(slug: string, excludeFormId?: string): boolean {
  const current = getForms();
  return !current.some(f => f.slug.toLowerCase() === slug.toLowerCase() && f.id !== excludeFormId);
}

// -------------------------------------------------------------
// Form Templates — reusable field schemas for the form builder
// -------------------------------------------------------------

export function getFormTemplates(): FormTemplateItem[] {
  if (typeof window === 'undefined') return initialFormTemplates;
  const saved = localStorage.getItem('leads_form_templates');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return initialFormTemplates;
}

export function saveFormTemplates(templates: FormTemplateItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_form_templates', JSON.stringify(templates));
  markLocalWrite('leads_form_templates');
}

export function addFormTemplate(template: Omit<FormTemplateItem, 'id' | 'createdAt'>): FormTemplateItem {
  const current = getFormTemplates();
  const newTemplate: FormTemplateItem = {
    ...template,
    id: 'tmpl_' + Date.now(),
    createdAt: new Date().toISOString().split('T')[0]
  };
  current.unshift(newTemplate);
  saveFormTemplates(current);
  serverPost('/api/form-templates', newTemplate);
  logAuditEvent('FORM_TEMPLATE_CREATED', template.createdBy, `Saved form template "${template.name}"`);
  return newTemplate;
}

export function deleteFormTemplate(id: string, actorName: string): boolean {
  const current = getFormTemplates();
  const target = current.find(t => t.id === id);
  if (!target) return false;

  const updated = current.filter(t => t.id !== id);
  saveFormTemplates(updated);
  serverDelete('/api/form-templates', id);
  logAuditEvent('FORM_TEMPLATE_DELETED', actorName, `Deleted form template "${target.name}"`);
  return true;
}

export function getSubmissions(): FormSubmissionItem[] {
  if (typeof window === 'undefined') return initialSubmissions;
  const saved = localStorage.getItem('leads_form_submissions');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialSubmissions;
}

export function addSubmission(sub: Omit<FormSubmissionItem, 'id' | 'submittedAt'>): FormSubmissionItem {
  const current = getSubmissions();
  const now = new Date();
  const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newSub: FormSubmissionItem = {
    ...sub,
    id: 'sub_' + Date.now(),
    submittedAt: formatted
  };
  current.unshift(newSub);
  if (typeof window !== 'undefined') {
    localStorage.setItem('leads_form_submissions', JSON.stringify(current));
    markLocalWrite('leads_form_submissions');
    serverPost('/api/submissions', newSub);
  }
  logAuditEvent('FORM_SUBMITTED', 'Public Respondent', `New response submitted for form slug "${sub.slug}"`);
  return newSub;
}

// -------------------------------------------------------------
// Audit Logs
// -------------------------------------------------------------

export function getAuditLogs(): AuditLogItem[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('leads_audit_logs');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

export function logAuditEvent(action: string, actorName: string, details: string, actorEmail?: string): void {
  if (typeof window === 'undefined') return;
  const current = getAuditLogs();
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newLog: AuditLogItem = {
    id: 'log_' + Date.now(),
    action,
    actorName,
    actorEmail: actorEmail || 'system@msruas.ac.in',
    details,
    timestamp
  };
  current.unshift(newLog);
  // Keep last 200 logs in localStorage (aligns with server)
  localStorage.setItem('leads_audit_logs', JSON.stringify(current.slice(0, 200)));
  markLocalWrite('leads_audit_logs');
  // Push to server asynchronously (fire-and-forget)
  serverPost('/api/auditlogs', newLog);
}

// -------------------------------------------------------------
// Design Portal & Proofreading Workflow
// -------------------------------------------------------------

export function getDesigns(): DesignSubmissionItem[] {
  if (typeof window === 'undefined') return initialDesigns;
  const saved = localStorage.getItem('leads_designs');
  if (saved) {
    try {
      const items: DesignSubmissionItem[] = JSON.parse(saved);
      const now = new Date().getTime();
      return items.map(item => {
        const expiresAtMs = new Date(item.expiresAt).getTime();
        if (now > expiresAtMs && !item.isExpired) {
          return { ...item, isExpired: true };
        }
        return item;
      });
    } catch (e) {
      console.error(e);
    }
  }
  return initialDesigns;
}

export function saveDesigns(designs: DesignSubmissionItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_designs', JSON.stringify(designs));
  markLocalWrite('leads_designs');
}

/**
 * Unlike most mutations in this file, a design submission's server round-trip
 * is awaited rather than fired-and-forgotten: the uploaded file only actually
 * exists once the server has converted and saved it, so a silent server-side
 * failure here (a bad request, the file never arriving, a transient network
 * blip) previously left the designer looking at what appeared to be a
 * successful upload in their own browser — the local write always
 * succeeded — while no file (and no record at all) ever reached the server
 * or any other user's view. On failure, the optimistic local write is rolled
 * back and an error is thrown so the caller can show it and let the designer
 * retry, instead of a submission that silently goes nowhere.
 */
export async function addDesign(design: Omit<DesignSubmissionItem, 'id' | 'submittedAt' | 'expiresAt' | 'isExpired'>): Promise<DesignSubmissionItem> {
  if (design.fileSize > 25 * 1024 * 1024) {
    throw new Error('File size exceeds the 25 MB limit.');
  }

  const current = getDesigns();
  const now = new Date();
  const submittedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const newDesign: DesignSubmissionItem = {
    ...design,
    id: 'des_' + Date.now(),
    submittedAt,
    expiresAt,
    isExpired: false,
    review: design.proofreadRequested && design.assignedProofreaderId ? {
      proofreaderId: design.assignedProofreaderId,
      proofreaderName: design.assignedProofreaderName || 'Proofreader',
      status: 'Pending Proofread',
    } : undefined
  };

  current.unshift(newDesign);
  saveDesigns(current);

  const serverResult = await serverPost('/api/designs', newDesign);
  if (!serverResult) {
    saveDesigns(getDesigns().filter(d => d.id !== newDesign.id));
    throw new Error('The design failed to upload to the server. Please check your connection and try again.');
  }

  const proofreadMsg = design.proofreadRequested ? ` (Requested proofread from ${design.assignedProofreaderName})` : '';
  logAuditEvent('DESIGN_SUBMITTED', design.designerName, `Submitted design "${design.title}" (${(design.fileSize / (1024 * 1024)).toFixed(2)} MB)${proofreadMsg}`, design.designerEmail);

  return newDesign;
}

/**
 * Synchronize design finalization state with the Task & Rating system.
 * A design is considered finalized when:
 * 1. styleStatus === 'Style Approved'
 * 2. If proofreadRequested is true, review?.status === 'Proofread Approved'
 *
 * Once finalized, it automatically creates or completes a Task (linked to an Event
 * if present, or as a standalone deliverable if not), entering the Task Evaluation Queue
 * on the Ratings page.
 */
function syncDesignTask(item: DesignSubmissionItem, reviewerName: string): DesignSubmissionItem {
  const isStyleApproved = item.styleStatus === 'Style Approved';
  const isProofreadApproved = !item.proofreadRequested || item.review?.status === 'Proofread Approved';
  const isFullyFinalized = isStyleApproved && isProofreadApproved;

  let updatedItem = { ...item };

  if (isFullyFinalized) {
    if (updatedItem.linkedTaskId) {
      updateTask(updatedItem.linkedTaskId, { status: 'Completed' }, reviewerName);
    } else {
      const task = addTask({
        title: `Design Approved: ${updatedItem.title}`,
        event: updatedItem.eventName || undefined,
        eventId: updatedItem.eventId || undefined,
        assignee: updatedItem.designerName,
        assigneeId: updatedItem.designerId,
        assigneeEmail: updatedItem.designerEmail,
        assigneeType: 'individual',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Completed',
        creatorName: reviewerName,
        isDesignDeliverable: true,
      });
      updatedItem.linkedTaskId = task.id;
    }

    // Auto-create Instagram and LinkedIn posting follow-up tasks if not already created
    if (!updatedItem.linkedInstagramTaskId || !updatedItem.linkedLinkedinTaskId) {
      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (!updatedItem.linkedInstagramTaskId) {
        const instaTask = addTask({
          title: `Instagram Posting: ${updatedItem.title}`,
          event: updatedItem.eventName || undefined,
          eventId: updatedItem.eventId || undefined,
          assignee: updatedItem.designerName,
          assigneeId: updatedItem.designerId,
          assigneeEmail: updatedItem.designerEmail,
          assigneeType: 'individual',
          dueDate,
          status: 'In Progress',
          creatorName: reviewerName,
          isDesignDeliverable: true,
        });
        updatedItem.linkedInstagramTaskId = instaTask.id;
      }

      if (!updatedItem.linkedLinkedinTaskId) {
        const linkedinTask = addTask({
          title: `LinkedIn Posting: ${updatedItem.title}`,
          event: updatedItem.eventName || undefined,
          eventId: updatedItem.eventId || undefined,
          assignee: updatedItem.designerName,
          assigneeId: updatedItem.designerId,
          assigneeEmail: updatedItem.designerEmail,
          assigneeType: 'individual',
          dueDate,
          status: 'In Progress',
          creatorName: reviewerName,
          isDesignDeliverable: true,
        });
        updatedItem.linkedLinkedinTaskId = linkedinTask.id;
      }
    }
    return updatedItem;
  } else if (updatedItem.linkedTaskId) {
    // If a previously approved design is no longer fully finalized (e.g. proofreader requested changes or style rejected),
    // revert its task to 'In Progress' if not already rated.
    const linkedTask = getTasks().find(t => t.id === updatedItem.linkedTaskId);
    if (linkedTask && !linkedTask.ratingScore) {
      updateTask(updatedItem.linkedTaskId, { status: 'In Progress' }, reviewerName);
    }
  }

  return updatedItem;
}

export function updateDesignReview(
  id: string,
  reviewStatus: 'Proofread Approved' | 'Changes Requested',
  comments: string,
  reviewerName: string
): DesignSubmissionItem | null {
  const current = getDesigns();
  const idx = current.findIndex(d => d.id === id);
  if (idx === -1) return null;

  const item = current[idx];
  const updatedReview: DesignProofreadReview = {
    proofreaderId: item.assignedProofreaderId || 'reviewer',
    proofreaderName: reviewerName,
    status: reviewStatus,
    comments,
    reviewedAt: new Date().toISOString()
  };

  let updatedItem: DesignSubmissionItem = {
    ...item,
    review: updatedReview
  };

  updatedItem = syncDesignTask(updatedItem, reviewerName);

  current[idx] = updatedItem;
  saveDesigns(current);
  serverPatch('/api/designs', id, current[idx]);
  logAuditEvent('DESIGN_PROOFREAD_UPDATED', reviewerName, `Updated proofread review for design "${item.title}" to ${reviewStatus}`);
  
  return current[idx];
}

export function updateDesignStyleReview(
  id: string,
  styleStatus: 'Style Approved' | 'Style Rejected',
  styleFeedback: string,
  reviewerName: string
): DesignSubmissionItem | null {
  const current = getDesigns();
  const idx = current.findIndex(d => d.id === id);
  if (idx === -1) return null;

  const item = current[idx];
  let updated: DesignSubmissionItem = {
    ...item,
    styleStatus,
    styleFeedback,
    styleDecidedBy: reviewerName,
    styleDecidedAt: new Date().toISOString()
  };

  updated = syncDesignTask(updated, reviewerName);

  current[idx] = updated;
  saveDesigns(current);
  serverPatch('/api/designs', id, current[idx]);
  logAuditEvent('DESIGN_STYLE_REVIEW_UPDATED', reviewerName, `Design Head updated style review for design "${item.title}" to ${styleStatus}`);

  return current[idx];
}

/**
 * Replace the uploaded asset on an existing design submission — e.g. after
 * "Changes Requested" — without creating a new record. Resets any prior
 * proofread/style decision back to pending, since the reviewed file no
 * longer exists. The server round-trip is awaited (see addDesign for why) —
 * a failed upload rolls the local record back to the file it had before,
 * rather than leaving the UI showing a "replaced" file that never actually
 * reached the server.
 */
export async function updateDesignFile(
  id: string,
  fileData: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  actorName: string,
  ocrScan?: OcrScanResult
): Promise<DesignSubmissionItem | null> {
  if (fileSize > 25 * 1024 * 1024) {
    throw new Error('File size exceeds the 25 MB limit.');
  }

  const current = getDesigns();
  const idx = current.findIndex(d => d.id === id);
  if (idx === -1) return null;

  const item = current[idx];
  let updated: DesignSubmissionItem = {
    ...item,
    fileData,
    fileName,
    fileSize,
    fileType,
    // The replaced file's own scan (if the designer ran one), or cleared —
    // the previous ocrScan described the file being replaced, not this one.
    ocrScan,
    review: item.review ? { ...item.review, status: 'Pending Proofread', comments: undefined, reviewedAt: undefined } : item.review,
    styleStatus: item.styleStatus ? 'Pending' : item.styleStatus,
    styleFeedback: undefined,
  };

  updated = syncDesignTask(updated, actorName);

  current[idx] = updated;
  saveDesigns(current);

  const serverResult = await serverPatch('/api/designs', id, updated);
  if (!serverResult) {
    const rolledBack = getDesigns();
    const rbIdx = rolledBack.findIndex(d => d.id === id);
    if (rbIdx !== -1) {
      rolledBack[rbIdx] = item;
      saveDesigns(rolledBack);
    }
    throw new Error('The replacement file failed to upload to the server. Please check your connection and try again.');
  }

  logAuditEvent('DESIGN_FILE_REPLACED', actorName, `Replaced the uploaded file for design "${item.title}"`);

  return updated;
}

export function deleteDesign(id: string, actorName: string): boolean {
  const current = getDesigns();
  const target = current.find(d => d.id === id);
  if (!target) return false;

  const updated = current.filter(d => d.id !== id);
  saveDesigns(updated);
  serverDelete('/api/designs', id);
  logAuditEvent('DESIGN_DELETED', actorName, `Deleted design submission "${target.title}"`);
  return true;
}

// -------------------------------------------------------------
// Group Policy Management (Super User-only dynamic access control)
// -------------------------------------------------------------

export function getGroupPolicies(): GroupPolicy[] {
  if (typeof window === 'undefined') return initialGroupPolicies;
  const saved = localStorage.getItem('leads_group_policies');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return initialGroupPolicies;
}

export function saveGroupPolicies(policies: GroupPolicy[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_group_policies', JSON.stringify(policies));
  markLocalWrite('leads_group_policies');
}

export function addGroupPolicy(policy: Omit<GroupPolicy, 'id' | 'createdAt'>): GroupPolicy {
  const current = getGroupPolicies();
  const newPolicy: GroupPolicy = {
    ...policy,
    id: 'policy_' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  current.unshift(newPolicy);
  saveGroupPolicies(current);
  serverPost('/api/group-policies', newPolicy);
  logAuditEvent('GROUP_POLICY_CREATED', policy.createdBy, `Created group policy tag "${newPolicy.name}" [${newPolicy.tag}] granting: ${newPolicy.capabilities.join(', ') || 'none'}`);
  return newPolicy;
}

export function updateGroupPolicy(id: string, updates: Partial<GroupPolicy>, actorName: string): GroupPolicy | null {
  const current = getGroupPolicies();
  const idx = current.findIndex(p => p.id === id);
  if (idx === -1) return null;

  current[idx] = { ...current[idx], ...updates, updatedAt: new Date().toISOString() };
  saveGroupPolicies(current);
  serverPatch('/api/group-policies', id, current[idx]);
  logAuditEvent('GROUP_POLICY_UPDATED', actorName, `Updated group policy tag "${current[idx].name}" [${current[idx].tag}]`);
  return current[idx];
}

export function deleteGroupPolicy(id: string, actorName: string): boolean {
  const current = getGroupPolicies();
  const target = current.find(p => p.id === id);
  if (!target) return false;

  const updated = current.filter(p => p.id !== id);
  saveGroupPolicies(updated);
  serverDelete('/api/group-policies', id);
  logAuditEvent('GROUP_POLICY_DELETED', actorName, `Deleted group policy tag "${target.name}" [${target.tag}]`);
  return true;
}

// -------------------------------------------------------------
// Access Level Settings (Super User-only, editable built-in access rules)
// -------------------------------------------------------------

export function getAccessLevelSettings(): AccessLevelSettings {
  if (typeof window === 'undefined') return DEFAULT_ACCESS_LEVEL_SETTINGS;
  const saved = localStorage.getItem('leads_access_level_settings');
  if (saved) {
    try {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr) && arr.length > 0) return { ...DEFAULT_ACCESS_LEVEL_SETTINGS, ...arr[0] };
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_ACCESS_LEVEL_SETTINGS;
}

export function updateAccessLevelSettings(updates: Partial<AccessLevelSettings>, actorName: string): AccessLevelSettings {
  const current = getAccessLevelSettings();
  const updated: AccessLevelSettings = {
    ...current,
    ...updates,
    id: 'default',
    updatedAt: new Date().toISOString(),
    updatedBy: actorName,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('leads_access_level_settings', JSON.stringify([updated]));
    markLocalWrite('leads_access_level_settings');
  }
  serverPost('/api/access-level-settings', updated);
  logAuditEvent(
    'ACCESS_LEVEL_SETTINGS_CHANGED',
    actorName,
    `Updated built-in access level rules: ${Object.keys(updates).join(', ')}`
  );
  return updated;
}

// -------------------------------------------------------------
// System Settings (Super User-only site-wide lockdown switch)
// -------------------------------------------------------------

export function getSystemSettings(): SystemSettings {
  if (typeof window === 'undefined') return DEFAULT_SYSTEM_SETTINGS;
  const saved = localStorage.getItem('leads_system_settings');
  if (saved) {
    try {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr) && arr.length > 0) return { ...DEFAULT_SYSTEM_SETTINGS, ...arr[0] };
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_SYSTEM_SETTINGS;
}

export function updateSystemSettings(updates: Partial<SystemSettings>, actorName: string): SystemSettings {
  const current = getSystemSettings();
  const updated: SystemSettings = {
    ...current,
    ...updates,
    id: 'default',
    updatedAt: new Date().toISOString(),
    updatedBy: actorName,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('leads_system_settings', JSON.stringify([updated]));
    markLocalWrite('leads_system_settings');
  }
  serverPost('/api/system-settings', updated);
  logAuditEvent(
    'SYSTEM_LOCKDOWN_CHANGED',
    actorName,
    updated.lockdownEnabled ? 'Enabled site-wide lockdown — every user except the Super User now sees a Not Found screen' : 'Disabled site-wide lockdown — normal access restored for everyone'
  );
  return updated;
}

/**
 * Client Helper: Request a 5-minute password reset OTP
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message?: string; error?: string; expiresAt?: number; adminOverride?: boolean; name?: string }> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.adminOverride) {
      return { success: true, adminOverride: true, message: data.message, name: data.name };
    }
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to send reset code.' };
    }
    return { success: true, message: data.message, expiresAt: data.expiresAt };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error requesting password reset.' };
  }
}

/**
 * Client Helper: Submit OTP and set new password
 */
export async function submitPasswordReset(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to reset password.' };
    }
    
    // Pull the freshly-hashed passwordHash back from the server rather than mirroring
    // the plaintext newPassword into the local cache ourselves.
    await syncWithServer();

    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error submitting password reset.' };
  }
}

/**
 * Client Helper: Request a 5-minute OTP to authorize changing the account's
 * login email. The code is sent to the CURRENT (old) email, not the new one.
 */
export async function requestEmailChange(memberId: string, currentEmail: string, newEmail: string): Promise<{ success: boolean; message?: string; error?: string; expiresAt?: number }> {
  try {
    const res = await fetch('/api/auth/request-email-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, currentEmail, newEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to send verification code.' };
    }
    return { success: true, message: data.message, expiresAt: data.expiresAt };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error requesting email change.' };
  }
}

/**
 * Client Helper: Submit the OTP sent to the old email and apply the new one.
 */
export async function confirmEmailChange(memberId: string, otp: string): Promise<{ success: boolean; message?: string; error?: string; newEmail?: string }> {
  try {
    const res = await fetch('/api/auth/confirm-email-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to confirm email change.' };
    }

    // Pull the freshly-updated record back from the server rather than mirroring
    // the change into the local cache ourselves.
    await syncWithServer();

    return { success: true, message: data.message, newEmail: data.newEmail };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error confirming email change.' };
  }
}

/**
 * Client Helper: Fetch sent email logs from database
 */
export async function getEmailLogs(): Promise<any[]> {
  try {
    const res = await fetch('/api/email');
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('Error fetching email logs:', e);
    return [];
  }
}

/**
 * Client Helper: Super User / Admin request member password setup (admin override)
 */
export async function requestMemberPasswordReset(memberId: string, mustReset: boolean = true): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/members/${memberId}/require-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mustReset }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update password reset request.' };
    }
    await syncWithServer();
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error setting password reset request.' };
  }
}

/**
 * Client Helper: Super User Only — directly set a member's password. Takes effect
 * immediately (no OTP, no "set up on next login" step for the member to complete).
 */
export async function adminSetMemberPassword(memberId: string, newPassword: string, actorName: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/members/${memberId}/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword, actorName }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to set password.' };
    }
    await syncWithServer();
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error setting password.' };
  }
}

/**
 * Client Helper: Submit new password via Super User Admin Override (no OTP required)
 */
export async function submitAdminOverridePasswordReset(email: string, newPassword: string): Promise<{ success: boolean; message?: string; user?: any; error?: string }> {
  try {
    const res = await fetch('/api/auth/override-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update password via admin override.' };
    }
    await syncWithServer();
    return { success: true, message: data.message, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error submitting admin override password reset.' };
  }
}




