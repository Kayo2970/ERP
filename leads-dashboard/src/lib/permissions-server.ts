/**
 * permissions-server.ts — Server-side authorization checks for API routes.
 *
 * `src/lib/permissions.ts` (the client's permission engine) cannot be reused
 * directly here: its checks (isCentreHead, isSectorHead, hasCapability, ...)
 * pull member/policy/settings data via local-data.ts's getMembers()/
 * getGroupPolicies()/getAccessLevelSettings(), which read from browser
 * localStorage (`typeof window === 'undefined' ? [] : ...`). Called from a
 * server route those all silently resolve to empty, so every permission
 * check would resolve false for everyone — a locked-out app, not a secure
 * one. This module re-derives the same built-in tier/role rules against the
 * real server-side collections (read via server-db.ts) instead.
 *
 * Group Policies: the dynamic capability / moduleAccess-edit grants are
 * resolved once per request (resolvePolicyGrants) and attached to the
 * signed-in member by session.ts, so every can*() check here consults them
 * the same way the client's permissions.ts does (hasCap / moduleEditOverride).
 * Still client-only: moduleAccess *view* scopes (ALL/OWN record filtering) and
 * the one-time "own record" edit grants, which need per-record context.
 */
import { readCollection } from './server-db';

// Below this point: additive ports of specific composite `can*` checks from
// permissions.ts (client) needed to gate the Events/Tasks/Ratings API routes.
// Same disclosed limitation as the rest of this file — Group Policy
// capability/moduleAccess overrides are NOT consulted here, only the
// hardcoded tier/role/keyword rule each function mirrors.

export interface AccessLevelSettings {
  headKeyword: string;
  sectorHeadKeywords: string;
  sectorHeadMaxTier: number;
  financeKeyword: string;
  baseLeadershipMaxTier: number;
  coreCommitteeTier: number;
}

const DEFAULT_ACCESS_LEVEL_SETTINGS: AccessLevelSettings = {
  headKeyword: 'head',
  sectorHeadKeywords: 'sector head,centre head,department head,base leadership',
  sectorHeadMaxTier: 2,
  financeKeyword: 'finance',
  baseLeadershipMaxTier: 3,
  coreCommitteeTier: 5,
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordMatches(text: string, keyword: string): boolean {
  const kw = (keyword || '').trim();
  if (!kw) return false;
  return new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i').test(text);
}

function anyKeywordMatches(text: string, keywords: string): boolean {
  return (keywords || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .some(k => new RegExp(`\\b${escapeRegex(k)}\\b`, 'i').test(text));
}

export async function getAccessLevelSettingsServer(): Promise<AccessLevelSettings> {
  const rows = await readCollection<any>('accessLevelSettings');
  const stored = rows?.[0];
  return stored ? { ...DEFAULT_ACCESS_LEVEL_SETTINGS, ...stored } : DEFAULT_ACCESS_LEVEL_SETTINGS;
}

export type ServerUser = { id?: string; tier?: number; role?: string; division?: string; department?: string; email?: string; name?: string } | null | undefined;

/** Same matching rules as permissions.ts memberMatchesPolicy, against a plain member/user record. */
function policyTargetsUser(p: any, user: NonNullable<ServerUser>): boolean {
  if (user.id && p.targetMemberIds?.includes(user.id)) return true;
  if (p.targetDivisions?.length && user.division && p.targetDivisions.includes(user.division)) return true;
  if (p.targetTiers?.length && typeof user.tier === 'number' && p.targetTiers.includes(user.tier)) return true;
  if (p.targetDesignationKeyword?.trim()) {
    const kw = p.targetDesignationKeyword.trim().toLowerCase();
    if ((user.role || '').toLowerCase().includes(kw)) return true;
  }
  return false;
}

export interface PolicyGrants {
  capabilities: string[];
  /** Per module key, the strongest Edit override from matching policies (ALL > OWN > NONE), like permissions.ts's resolveModuleEditOverride. */
  moduleEdit: Record<string, 'ALL' | 'OWN' | 'NONE'>;
}

/**
 * Resolve everything the member's enabled, unexpired Group Policies grant, once per request. session.ts attaches the
 * result to the signed-in member (non-enumerable, so it is never persisted or sent back), which lets every synchronous
 * can*() check below consult Group Policies exactly like the client's permissions.ts does.
 */
export async function resolvePolicyGrants(user: ServerUser): Promise<PolicyGrants> {
  const grants: PolicyGrants = { capabilities: [], moduleEdit: {} };
  if (!user || user.tier === 1) return grants; // Super User holds everything implicitly
  const policies = await readCollection<any>('groupPolicies');
  const now = new Date().toISOString();
  const caps = new Set<string>();
  const rank = { NONE: 0, OWN: 1, ALL: 2 } as const;
  for (const p of policies || []) {
    if (p.enabled === false) continue;
    if (p.expiresAt && p.expiresAt <= now) continue;
    if (!policyTargetsUser(p, user)) continue;
    (p.capabilities || []).forEach((c: string) => caps.add(c));
    for (const [moduleKey, access] of Object.entries<any>(p.moduleAccess || {})) {
      const edit = access?.edit as 'ALL' | 'OWN' | 'NONE' | undefined;
      if (!edit) continue;
      const current = grants.moduleEdit[moduleKey];
      if (!current || rank[edit] > rank[current]) grants.moduleEdit[moduleKey] = edit;
    }
  }
  grants.capabilities = Array.from(caps);
  return grants;
}

/** Synchronous capability check against the grants session.ts attached to the signed-in member. Super User always true. */
export function hasCap(user: ServerUser, capability: string): boolean {
  if (!user) return false;
  if (user.tier === 1) return true;
  return !!(user as any).__policyGrants?.capabilities?.includes(capability);
}

/** Explicit Edit override a Group Policy sets for `moduleKey` (undefined when none). Super User is always 'ALL'. */
export function moduleEditOverride(user: ServerUser, moduleKey: string): 'ALL' | 'OWN' | 'NONE' | undefined {
  if (!user) return undefined;
  if (user.tier === 1) return 'ALL';
  return (user as any).__policyGrants?.moduleEdit?.[moduleKey];
}

/**
 * Server-side port of permissions.ts's hasCapability/isPolicyActive/
 * memberMatchesPolicy — the "deliberate, disclosed limitation" this file's
 * header calls out (Group Policy capability grants weren't consulted by any
 * server route). Only wired into the small set of routes below that
 * actually need a specific capability to be enforceable end-to-end (a
 * client-visible grant that always 403s server-side is worse than no grant
 * at all); everywhere else in the app, a capability grant remains a
 * client-side-only UI gate exactly as it always has been — this function
 * does not change that for anything it isn't explicitly called from.
 */
export async function hasCapabilityServer(user: ServerUser, capability: string): Promise<boolean> {
  if (!user) return false;
  if (user.tier === 1) return true;
  if ((user as any).__policyGrants) return hasCap(user, capability);
  const policies = await readCollection<any>('groupPolicies');
  const now = new Date().toISOString();
  return (policies || []).some((p: any) => {
    if (p.enabled === false) return false;
    if (p.expiresAt && p.expiresAt <= now) return false;
    if (!p.capabilities?.includes(capability)) return false;
    if (user.id && p.targetMemberIds?.includes(user.id)) return true;
    if (p.targetDivisions?.length && user.division && p.targetDivisions.includes(user.division)) return true;
    if (p.targetTiers?.length && typeof user.tier === 'number' && p.targetTiers.includes(user.tier)) return true;
    if (p.targetDesignationKeyword?.trim()) {
      const kw = p.targetDesignationKeyword.trim().toLowerCase();
      if ((user.role || '').toLowerCase().includes(kw)) return true;
    }
    return false;
  });
}

// Mirrors permissions.ts's isExecutiveRole — Faculty Ambassador is deliberately
// given identical standing to Chief Coordinator by matching here too.
export function isExecutiveRole(user: ServerUser): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return role.includes('president') || role.includes('vice president') || role.includes('chief coordinator') || role.includes('faculty ambassador');
}

export function isAlumniRole(user: ServerUser): boolean {
  if (!user) return false;
  const division = (user.division || '').toLowerCase();
  const role = (user.role || '').toLowerCase();
  return user.tier === 7 || division.includes('alumni') || role.includes('alumni');
}

export function isHeadRole(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user || typeof user.role !== 'string') return false;
  return keywordMatches(user.role, settings.headKeyword);
}

export function isBaseLeadership(user: ServerUser, settings: AccessLevelSettings): boolean {
  return !!user && typeof user.tier === 'number' && user.tier <= settings.baseLeadershipMaxTier;
}

export function isCoreCommitteeTier(user: ServerUser, settings: AccessLevelSettings): boolean {
  return !!user && user.tier === settings.coreCommitteeTier;
}

export function isSectorHead(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  const role = user.role || '';
  const isSectorOrCentreHead = anyKeywordMatches(role, settings.sectorHeadKeywords);
  const isGeneralHead = isHeadRole(user, settings) && !keywordMatches(role, settings.financeKeyword);
  return (typeof user.tier === 'number' && user.tier <= settings.sectorHeadMaxTier) || isSectorOrCentreHead || isGeneralHead || hasCap(user, 'APPROVE_REIMBURSEMENTS_SECTOR');
}

export function isFinanceHead(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  const role = user.role || '';
  const dept = user.department || '';
  const isFinanceRole = keywordMatches(role, settings.financeKeyword);
  const isFinanceDept = keywordMatches(dept, settings.financeKeyword);
  return user.tier === 1 || isFinanceRole || isFinanceDept || hasCap(user, 'APPROVE_REIMBURSEMENTS_FINANCE');
}

// Mirrors permissions.ts's isChiefAdvisor — the view-only Faculty position,
// deliberately excluded from isCentreHead/isAdvisor below despite its role
// text containing the word "Advisor", so it's never mistaken for the real,
// edit-capable Advisor position.
export function isChiefAdvisor(user: ServerUser): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return role.includes('chief advisor');
}

export function isCentreHead(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  if (user.tier === 1) return true;
  if (isChiefAdvisor(user)) return false;
  const role = user.role || '';
  return (typeof user.tier === 'number' && user.tier <= settings.sectorHeadMaxTier) || anyKeywordMatches(role, settings.sectorHeadKeywords) || keywordMatches(role, 'advisor');
}

export function isEventsHeadGgCampus(user: ServerUser): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role.includes('finance')) return false;
  if (user.tier === 2.5) return true;
  return (role.includes('events head') && role.includes('gg')) || (role.includes('head of events') && role.includes('gg')) || (role.includes('events') && role.includes('gg campus'));
}

export function isDesignHead(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  if (isCentreHead(user, settings)) return true; // Super User, Centre Head, and Advisor all have design review authority
  const role = (user.role || '').toLowerCase();
  const dept = (user.department || '').toLowerCase();
  const isDesign = role.includes('design') || dept.includes('design') || role.includes('social media') || dept.includes('social media');
  return isHeadRole(user, settings) && isDesign;
}

/** Load the resolved server-side permission context once per request. */
export async function loadPermissionContext() {
  const settings = await getAccessLevelSettingsServer();
  return { settings };
}

// --- Composite checks mirroring permissions.ts's built-in (non-policy) rules ---

export function canTerminateMember(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isCentreHead(user, settings) || user?.tier === 1 || hasCap(user, 'TERMINATE_MEMBER');
}

export function canSetMemberPassword(user: ServerUser): boolean {
  return user?.tier === 1;
}

// Directory add/remove is restricted to Centre Head, Advisor, and Super
// User (all covered by isCentreHead) — mirrors permissions.ts's
// canEditDirectory/canAddMember. Everyone else keeps read-only directory
// access; this file's disclosed limitation (no Group Policy capability
// override check) still applies, same as every other check here.
export function canEditDirectory(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isCentreHead(user, settings);
}

export function canAddMember(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isAlumniRole(user)) return false;
  return canEditDirectory(user, settings);
}

export function canApproveAsSectorHead(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isSectorHead(user, settings);
}

export function canVerifyReimbursementCentreHead(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isCentreHead(user, settings) || user?.tier === 1;
}

export function canApproveAsFinanceHead(user: ServerUser, settings: AccessLevelSettings, claim?: any): boolean {
  if (!user || !isFinanceHead(user, settings) || isExecutiveRole(user) || isAlumniRole(user)) return false;
  if (user.tier === 1 || isCentreHead(user, settings)) return true;
  if (!claim) return true;
  return claim.centreHeadVerified === true || claim.status === 'Verified by Centre Head' || claim.status === 'Under Review';
}

export function canVerifyBudgetCentreHead(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isCentreHead(user, settings) || user?.tier === 1;
}

export function canDecideBudget(user: ServerUser, settings: AccessLevelSettings, budget?: any): boolean {
  if (!user || !isFinanceHead(user, settings)) return false;
  if (user.tier === 1 || isCentreHead(user, settings)) return true;
  if (!budget) return true;
  return budget.centreHeadVerified === true;
}

export function canSubmitBudget(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isCentreHead(user, settings) || hasCap(user, 'PROPOSE_BUDGET') || hasCap(user, 'MANAGE_BUDGET');
}

// Mirrors permissions.ts's canDecideProcurementRequest — deliberately just
// Centre Head/Advisor, no capability-grant or Group Policy escape hatch.
export function canDecideProcurementRequest(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isCentreHead(user, settings) || isAdvisor(user);
}

// Mirrors permissions.ts's canViewProcurementRequest.
export function canViewProcurementRequest(user: ServerUser, settings: AccessLevelSettings, request: any): boolean {
  if (!user) return false;
  if (request.status === 'Approved' || request.status === 'Completed') return true;
  if (canDecideProcurementRequest(user, settings)) return true;
  if (request.requesterId && request.requesterId === user.id) return true;
  return !!request.requesterEmail && !!user.email && request.requesterEmail.toLowerCase() === user.email.toLowerCase();
}

export function canApproveAnnouncement(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  return isCentreHead(user, settings) || isEventsHeadGgCampus(user) || user.tier === 1 || user.tier === 2.5 || hasCap(user, 'APPROVE_ANNOUNCEMENT');
}

export function canRemoveGuestContact(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isCentreHead(user, settings) || user?.tier === 1 || hasCap(user, 'GUEST_DIRECTORY_DELETE');
}

export async function canDeleteForms(user: ServerUser, settings: AccessLevelSettings): Promise<boolean> {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  if (isCentreHead(user, settings) || user?.tier === 1) return true;
  return hasCapabilityServer(user, 'FORMS_DELETE');
}

export function canDeleteEvent(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isBaseLeadership(user, settings) || hasCap(user, 'EVENTS_DELETE');
}

export function canDeleteTask(user: ServerUser, settings: AccessLevelSettings, task?: any): boolean {
  if (isBaseLeadership(user, settings) || hasCap(user, 'TASKS_DELETE')) return true;
  if (task && user?.name && task.creatorName === user.name) return true;
  return false;
}

export function canManageBackup(user: ServerUser): boolean {
  return user?.tier === 1 || hasCap(user, 'MANAGE_BACKUP');
}

export function canManageEmailSettings(user: ServerUser, settings: AccessLevelSettings): boolean {
  return user?.tier === 1 || isCentreHead(user, settings) || hasCap(user, 'MANAGE_EMAIL_SETTINGS');
}

export function canManageGuestInvites(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isCentreHead(user, settings) || hasCap(user, 'MANAGE_GUEST_INVITES');
}

export function isChiefCoordinator(user: ServerUser): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return role.includes('chief coordinator');
}

export function isGeneralSecretary(user: ServerUser): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return user.tier === 5 && role.includes('general secretary') && !role.includes('senior');
}

export function canSubmitEventReport(user: ServerUser): boolean {
  if (!user) return false;
  if (user.tier === 1) return true;
  const override = moduleEditOverride(user, 'EVENT_REPORTS');
  if (override === 'NONE') return false;
  if (override === 'ALL' || override === 'OWN') return true;
  if (hasCap(user, 'EVENT_REPORTS_SUBMIT')) return true;
  return isGeneralSecretary(user) || isChiefCoordinator(user);
}

export function canReviewEventReports(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  if (user.tier === 1 || hasCap(user, 'EVENT_REPORTS_REVIEW') || moduleEditOverride(user, 'EVENT_REPORTS') === 'ALL') return true;
  return isCentreHead(user, settings) || isEventsHeadGgCampus(user);
}

export function canViewEventReports(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  return canReviewEventReports(user, settings) || canSubmitEventReport(user) || isGeneralSecretary(user) || isChiefCoordinator(user) || isExecutiveRole(user) || user.tier === 1 || hasCap(user, 'EVENT_REPORTS_SUBMIT') || hasCap(user, 'EVENT_REPORTS_VIEW_ALL') || hasCap(user, 'EVENT_REPORTS_REVIEW');
}

export function canReviewDesignProofread(user: ServerUser, settings: AccessLevelSettings, design?: { assignedProofreaderIds?: string[]; assignedProofreaderEmail?: string; assignedProofreaderId?: string }): boolean {
  if (!user) return false;
  if (isChiefAdvisor(user)) return false; // view-only
  if (design?.assignedProofreaderIds && user.id && design.assignedProofreaderIds.includes(user.id)) return true;
  if (design?.assignedProofreaderEmail && design.assignedProofreaderEmail === user.email) return true;
  if (design?.assignedProofreaderId && user.id && design.assignedProofreaderId === user.id) return true;
  return isCentreHead(user, settings) || isEventsHeadGgCampus(user) || isFaculty(user) || user.tier === 1;
}

export function isSuperUser(user: ServerUser): boolean {
  return user?.tier === 1;
}

export function isAdvisor(user: ServerUser): boolean {
  if (!user) return false;
  if (isSuperUser(user)) return false;
  if (isChiefAdvisor(user)) return false;
  const role = (user.role || '').toLowerCase();
  const division = ((user as any).division || '').toLowerCase();
  return keywordMatches(role, 'advisor') || role.includes('advisor') || division.includes('advisory');
}

export function canAccessGroupPoliciesServer(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  return isSuperUser(user) || isCentreHead(user, settings) || isEventsHeadGgCampus(user) || hasCap(user, 'MANAGE_GROUP_POLICIES') || moduleEditOverride(user, 'POLICIES') === 'ALL';
}

// --- Events / Tasks / Ratings composite checks (ported from permissions.ts) ---

export type ServerTask = {
  id?: string;
  title?: string;
  assigneeType?: string;
  assignee?: string;
  assigneeEmail?: string;
  assigneeId?: string;
  assigneeIds?: string[];
  eventId?: string;
  eventCommitteeId?: string;
  creatorName?: string;
  approvalStatus?: string;
  approverType?: string;
  approverMemberId?: string;
  submittedByEmail?: string;
  workflowType?: string;
  taskCategory?: string;
  isSocialMediaPost?: boolean;
  platform?: string;
} | null | undefined;

export type ServerEvent = {
  id?: string;
  approvalStatus?: string;
  approverType?: string;
  approverMemberId?: string;
  submittedByEmail?: string;
} | null | undefined;

export type ServerRating = {
  id?: string;
  raterName?: string;
} | null | undefined;

/** Check if user holds the designation of Head of Events (or Events Head). Ported from permissions.ts's isHeadOfEvents. */
export function isHeadOfEvents(user: ServerUser): boolean {
  if (!user) return false;
  const role = ((user as any)?.role || '').toLowerCase();
  return role.includes('head of event') || role.includes('head of events') || role.includes('events head');
}

/**
 * Check if user is Events Head for RTC Campus. Ported from permissions.ts's
 * isEventsHeadRtcCampus.
 */
export function isEventsHeadRtcCampus(user: ServerUser): boolean {
  if (!user) return false;
  const role = ((user as any)?.role || '').toLowerCase();
  const committee = ((user as any)?.committee || '').toLowerCase();
  return (role.includes('events head') && role.includes('rtc')) ||
         (role.includes('head of events') && role.includes('rtc')) ||
         (role.includes('events') && role.includes('rtc campus')) ||
         (committee.includes('rtc campus') && isHeadOfEvents(user));
}

/**
 * Whether `user` is the assignee of `task` — the individual assignee (by id,
 * email, or name), a member of the assigned group (`assigneeIds`), or, for a
 * committee-assigned task, a member/lead of the matching event committee.
 * Ported from local-data.ts's isTaskAssignee; the committee branch needs the
 * events collection, which is why this is async (the client version reads it
 * synchronously off localStorage via getEvents()).
 */
export async function isTaskAssignee(task: ServerTask, user: ServerUser): Promise<boolean> {
  if (!task || !user) return false;
  const memberId = user.id;

  if (task.assigneeType === 'committee') {
    if (!memberId) return false;
    const events = await readCollection<any>('events');
    const targetEvents = task.eventId ? events.filter((e: any) => e.id === task.eventId) : events;
    return targetEvents.some((e: any) =>
      (e.committees || []).some((c: any) =>
        (c.id === task.eventCommitteeId || (c.name || '').toLowerCase() === (task.assignee || '').toLowerCase()) &&
        ((c.memberIds || []).includes(memberId) || c.leadMemberId === memberId)
      )
    );
  }

  return Boolean(
    (task.assignee && user.name && task.assignee.toLowerCase() === user.name.toLowerCase()) ||
    (task.assigneeEmail && user.email && task.assigneeEmail.toLowerCase() === user.email.toLowerCase()) ||
    (task.assigneeId && task.assigneeId === memberId) ||
    (memberId && task.assigneeIds && task.assigneeIds.includes(memberId))
  );
}

/** Event creation baseline — leadership, Core Committee, or any Head role. Ported from permissions.ts's canCreateEvent (Group Policy EVENTS_CREATE grant out of scope). */
export function canCreateEvent(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isBaseLeadership(user, settings) || isCoreCommitteeTier(user, settings) || isHeadRole(user, settings) || hasCap(user, 'EVENTS_CREATE');
}

/** Event editing baseline — same as canCreateEvent. Ported from permissions.ts's canEditEvent (Group Policy moduleAccess/hasCapability override out of scope). */
export function canEditEvent(user: ServerUser, settings: AccessLevelSettings): boolean {
  const override = moduleEditOverride(user, 'EVENTS');
  if (override === 'NONE') return false;
  if (override === 'ALL') return true;
  return isBaseLeadership(user, settings) || isCoreCommitteeTier(user, settings) || isHeadRole(user, settings) || hasCap(user, 'EVENTS_EDIT');
}

/** Task creation baseline — leadership, Core Committee, or any Head role. Ported from permissions.ts's canCreateTask (Group Policy TASKS_CREATE grant out of scope). */
export function canCreateTask(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isBaseLeadership(user, settings) || isCoreCommitteeTier(user, settings) || isHeadRole(user, settings) || hasCap(user, 'TASKS_CREATE');
}

/** Task editing baseline — same as canCreateTask. Ported from permissions.ts's canEditTask (Group Policy moduleAccess/hasCapability override out of scope). */
export function canEditTask(user: ServerUser, settings: AccessLevelSettings): boolean {
  const override = moduleEditOverride(user, 'TASKS');
  if (override === 'NONE') return false;
  if (override === 'ALL') return true;
  return isBaseLeadership(user, settings) || isCoreCommitteeTier(user, settings) || isHeadRole(user, settings) || hasCap(user, 'TASKS_EDIT');
}

/**
 * Who may actually change a task's status — acknowledge it or mark it
 * complete. Ported from permissions.ts's canChangeTaskStatus: the assignee
 * themselves, the Centre Head, either campus's Head of Events, or the Super
 * User. Async because isTaskAssignee's committee branch needs the events
 * collection.
 */
export async function canChangeTaskStatus(task: ServerTask, user: ServerUser, settings: AccessLevelSettings): Promise<boolean> {
  if (!user || !task) return false;
  if (task.approvalStatus === 'pending_create' || task.approvalStatus === 'pending_edit' || task.approvalStatus === 'rejected') {
    return false;
  }
  if (user.tier === 1) return true;
  if (isCentreHead(user, settings)) return true;
  if (isHeadOfEvents(user) || isEventsHeadGgCampus(user) || isEventsHeadRtcCampus(user)) return true;
  if (isSocialMediaPostTask(task) && isSocialMediaHeadOrSrHead(user)) return true;
  return isTaskAssignee(task, user);
}

/**
 * Whether `user` is the resolved approver for a specific pending event
 * (create, edit, or delete). Ported from permissions.ts's
 * canApprovePendingEvent — a POLICY_TAG approver is deliberately denied
 * rather than resolved here (Group Policy tag resolution is out of scope
 * server-side).
 */
export function canApprovePendingEvent(event: ServerEvent, user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user || !event) return false;
  if (user.tier === 1) return true; // Super User always overrides.
  if (event.approvalStatus !== 'pending_create' && event.approvalStatus !== 'pending_edit' && event.approvalStatus !== 'pending_delete') return false;
  // Never let whoever submitted the change approve their own submission,
  // even if their role would otherwise resolve as the approver.
  if (event.submittedByEmail && user.email && String(event.submittedByEmail).toLowerCase() === user.email.toLowerCase()) return false;
  if (event.approverType === 'SPECIFIC_MEMBER') return user.id === event.approverMemberId;
  if (event.approverType === 'POLICY_TAG') return false;
  // CENTER_HEAD (default): matches canApprovePendingTask below — was
  // isSectorHead() before, which both missed Advisor (not in the
  // configurable sectorHeadKeywords list) and over-included any role merely
  // containing the word "head".
  return isCentreHead(user, settings) || isEventsHeadGgCampus(user);
}

/**
 * Whether `user` is the resolved approver for a specific pending task
 * (create or edit). Ported from permissions.ts's canApprovePendingTask — a
 * POLICY_TAG approver is deliberately denied rather than resolved here
 * (Group Policy tag resolution is out of scope server-side).
 */
export function canApprovePendingTask(task: ServerTask, user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user || !task) return false;
  if (user.tier === 1) return true; // Super User always overrides.
  if (task.approvalStatus !== 'pending_create' && task.approvalStatus !== 'pending_edit') return false;
  // Never let whoever submitted the change approve their own submission —
  // this is what let a Centre Head/GG Campus Events Head who delegated an
  // auto-generated task (see delegateAutoTask) turn around and approve their
  // own delegation, since the generic CENTER_HEAD resolution below would
  // otherwise match them too.
  if (task.submittedByEmail && user.email && String(task.submittedByEmail).toLowerCase() === user.email.toLowerCase()) return false;
  if (task.approverType === 'SPECIFIC_MEMBER') return user.id === task.approverMemberId;
  if (task.approverType === 'POLICY_TAG') return false;
  return isCentreHead(user, settings) || isEventsHeadGgCampus(user);
}

/**
 * Who may submit a rating for a student's event performance. Ported from
 * permissions.ts's canEvaluateEventStudent (the isAlumniRole exclusion and
 * the Design Head/isDesignDeliverable lane are omitted for simplicity, per
 * the ratings module having no alumni actors in practice).
 */
export async function canEvaluateEventStudent(user: ServerUser, settings: AccessLevelSettings): Promise<boolean> {
  if (!user) return false;
  if (isSuperUser(user) || isCentreHead(user, settings) || isAdvisor(user) || isEventsHeadGgCampus(user) || user.tier === 2.5) return true;
  return hasCapabilityServer(user, 'CREATE_RATING');
}

/**
 * Checks whether a task is eligible for ratings & evaluation on the server.
 * Procurement tasks and administrative approval requests are strictly excluded.
 */
export function isTaskRatable(task: { workflowType?: string; isProcurement?: boolean; procurementId?: string; title?: string } | null | undefined): boolean {
  if (!task) return false;
  if (task.workflowType === 'holiday_social_approval' || task.workflowType === 'procurement' || task.isProcurement || task.procurementId) return false;
  if (typeof task.title === 'string' && /procure items|procurement/i.test(task.title)) return false;
  return true;
}

/**
 * Rating edit/delete permission: the rating's own author, Centre Head, Advisor, or
 * the Super User. Ported from permissions.ts's canEditRating (Group Policy
 * RATING_EDIT_ANY grant / moduleAccess.RATINGS.edit override out of scope).
 */
export function canEditRating(rating: ServerRating, user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user || !rating) return false;
  const isAuthor = user.name === rating.raterName;
  return user.tier === 1 || isAuthor || isCentreHead(user, settings) || isAdvisor(user) || hasCap(user, 'RATING_EDIT_ANY');
}

// --- Designs / Forms / Announcements / Guests / Event Reports (ported from
// permissions.ts's built-in tier/role clauses; Group Policy capability and
// moduleAccess override clauses are intentionally NOT ported here, per this
// file's header). ---

/** Check if user is in the Faculty division or holds a professor/faculty title. Ported from permissions.ts's isFaculty. */
export function isFaculty(user: ServerUser): boolean {
  if (!user) return false;
  if ((user as any).division === 'Faculty') return true;
  const role = ((user as any).role || '').toLowerCase();
  return role.includes('faculty') || role.includes('professor') || role.includes('prof.');
}

/** Check if a member belongs to the student Social Media team. Professors/Faculty are strictly excluded. */
export function isSocialMediaTeamMember(member: { division?: string; department?: string; committee?: string; role?: string; status?: string } | null | undefined): boolean {
  if (!member || isFaculty(member as ServerUser) || member.status === 'Terminated') return false;
  const dept = (member.department || '').toLowerCase();
  const comm = (member.committee || '').toLowerCase();
  const role = (member.role || '').toLowerCase();
  return (
    dept.includes('social media') ||
    comm.includes('social media') ||
    role.includes('social media')
  );
}

/** Check if a member is the Head or Senior Head of Social Media. */
export function isSocialMediaHeadOrSrHead(member: { division?: string; department?: string; committee?: string; role?: string; status?: string } | null | undefined): boolean {
  if (!member || isFaculty(member as ServerUser) || member.status === 'Terminated') return false;
  if (!isSocialMediaTeamMember(member)) return false;
  const role = (member.role || '').toLowerCase();
  return role.includes('head') || role.includes('lead');
}

/** Check if a member is the Head of Social Media (non-senior). */
export function isSocialMediaHead(member: { division?: string; department?: string; committee?: string; role?: string; status?: string } | null | undefined): boolean {
  if (!member || isFaculty(member as ServerUser) || member.status === 'Terminated') return false;
  if (!isSocialMediaTeamMember(member)) return false;
  const role = (member.role || '').toLowerCase();
  return (role.includes('head') || role.includes('lead')) && !role.includes('senior') && !role.includes('sr');
}

/** Check if a member is the Senior Head of Social Media. */
export function isSocialMediaSrHead(member: { division?: string; department?: string; committee?: string; role?: string; status?: string } | null | undefined): boolean {
  if (!member || isFaculty(member as ServerUser) || member.status === 'Terminated') return false;
  if (!isSocialMediaTeamMember(member)) return false;
  const role = (member.role || '').toLowerCase();
  return (role.includes('head') || role.includes('lead')) && (role.includes('senior') || role.includes('sr.') || role.includes('sr '));
}

/** Check if a task is a social media posting/design deliverable task. */
export function isSocialMediaPostTask(task: {
  title?: string;
  workflowType?: string;
  taskCategory?: string;
  isSocialMediaPost?: boolean;
  platform?: string;
} | null | undefined): boolean {
  if (!task) return false;
  if (task.workflowType === 'design_social_posting' || task.workflowType === 'holiday_design_social' || task.workflowType === 'event_social_post') {
    return true;
  }
  if (task.isSocialMediaPost === true) return true;
  if (task.platform === 'instagram' || task.platform === 'linkedin') return true;
  const title = (task.title || '').toLowerCase();
  return title.includes('social media') || title.includes('[social media posting]');
}

/**
 * Design Portal visibility / edit-any-submission gate. Ported from
 * permissions.ts's canViewAllDesigns (built-in clause only: alumni/executive
 * excluded; base leadership or Design Head granted).
 */
export function canViewAllDesigns(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isAlumniRole(user) || isExecutiveRole(user)) return false;
  return isBaseLeadership(user, settings) || isDesignHead(user, settings) || hasCap(user, 'VIEW_ALL_DESIGNS');
}

/**
 * Form builder access. Ported from permissions.ts's canBuildForms (built-in
 * clause only): tier 1 or 5, any Head role, or an Executive role.
 */
export function canBuildForms(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isAlumniRole(user)) return false;
  return (!!user && (user.tier === 1 || user.tier === 5)) || isHeadRole(user, settings) || isExecutiveRole(user) || hasCap(user, 'BUILD_FORMS');
}

/**
 * Announcement authoring. Ported from permissions.ts's canCreateAnnouncement
 * (built-in clause only): base leadership, Core Committee, tier 4/5, Faculty,
 * or any Head role.
 */
export function canCreateAnnouncement(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user || isAlumniRole(user)) return false;
  if (isChiefAdvisor(user)) return false; // view-only
  return isBaseLeadership(user, settings) || isCoreCommitteeTier(user, settings) || user.tier === 4 || user.tier === 5 || isFaculty(user) || isHeadRole(user, settings) || hasCap(user, 'CREATE_ANNOUNCEMENT');
}

/**
 * Guest Directory (visiting-card contacts) access. Ported from
 * permissions.ts's canAccessGuestDirectory (built-in clause only): Centre
 * Head, Faculty, or an Executive role.
 */
export function canAccessGuestDirectory(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isAlumniRole(user)) return false;
  return isCentreHead(user, settings) || isFaculty(user) || isExecutiveRole(user) || hasCap(user, 'GUEST_DIRECTORY_ACCESS') || !!moduleEditOverride(user, 'GUEST_DIRECTORY');
}

export type ServerGuest = { createdBy?: string; metBy?: string } | null | undefined;

/**
 * Whether `guest` was created/met by `user` themselves. Ported from
 * permissions.ts's isOwnCreatedGuest.
 */
export function isOwnCreatedGuest(guest: ServerGuest, user: ServerUser): boolean {
  if (!user || !guest) return false;
  const userEmail = (user.email || '').trim().toLowerCase();
  const userName = (user.name || '').trim().toLowerCase();
  const userId = (user.id || '').trim().toLowerCase();

  const createdBy = (guest.createdBy || '').trim().toLowerCase();
  const metBy = (guest.metBy || '').trim().toLowerCase();

  if (createdBy && (createdBy === userEmail || createdBy === userId || createdBy === userName)) return true;
  if (metBy && metBy === userName) return true;
  return false;
}

/**
 * Per-row Guest Directory view/edit permission. Ported from permissions.ts's
 * canEditGuestRecord (built-in clause only): tier 1 or Centre Head always
 * allowed; otherwise only the guest's own creator/met-by. Used for both view
 * and edit checks per the scope note for this rollout.
 */
export function canEditGuestRecord(guest: ServerGuest, user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  if (user.tier === 1) return true;
  if (isCentreHead(user, settings)) return true;
  return isOwnCreatedGuest(guest, user);
}

export const canViewGuestRecord = canEditGuestRecord;
