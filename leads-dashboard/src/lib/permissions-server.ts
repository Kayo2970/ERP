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
 * Scope: this intentionally covers the hardcoded tier/role/keyword rules
 * only — not the dynamic Group Policy capability/moduleAccess override
 * system (per-member custom grants configured in Policies). A member who
 * only has access to an action through a Group Policy grant (rather than
 * their built-in tier/role) will be correctly authorized on the client's UI
 * but may see a 403 from the API until that system is ported here too. This
 * is a deliberate, disclosed limitation — porting the dynamic policy engine
 * safely is its own follow-up, not something to rush alongside the base
 * session/authorization rollout.
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

export function isExecutiveRole(user: ServerUser): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return role.includes('president') || role.includes('vice president') || role.includes('chief coordinator');
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
  return (typeof user.tier === 'number' && user.tier <= settings.sectorHeadMaxTier) || isSectorOrCentreHead || isGeneralHead;
}

export function isFinanceHead(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  const role = user.role || '';
  const dept = user.department || '';
  const isFinanceRole = keywordMatches(role, settings.financeKeyword);
  const isFinanceDept = keywordMatches(dept, settings.financeKeyword);
  return user.tier === 1 || isFinanceRole || isFinanceDept;
}

export function isCentreHead(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  if (user.tier === 1) return true;
  const role = user.role || '';
  return (typeof user.tier === 'number' && user.tier <= settings.sectorHeadMaxTier) || anyKeywordMatches(role, settings.sectorHeadKeywords) || keywordMatches(role, 'advisor');
}

export function isEventsHeadGgCampus(user: ServerUser): boolean {
  if (!user) return false;
  if (user.tier === 2.5) return true;
  const role = (user.role || '').toLowerCase();
  return (role.includes('events head') && role.includes('gg')) || (role.includes('head of events') && role.includes('gg')) || (role.includes('events') && role.includes('gg campus'));
}

export function isDesignHead(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  if (typeof user.tier === 'number' && user.tier <= 2) return true;
  const role = (user.role || '').toLowerCase();
  const dept = (user.department || '').toLowerCase();
  const isDesign = role.includes('design') || dept.includes('design');
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
  return isCentreHead(user, settings) || user?.tier === 1;
}

export function canSetMemberPassword(user: ServerUser): boolean {
  return user?.tier === 1;
}

export function canEditDirectory(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isBaseLeadership(user, settings);
}

export function canAddMember(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isAlumniRole(user)) return false;
  return isExecutiveRole(user) || canEditDirectory(user, settings);
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
  return isCentreHead(user, settings);
}

export function canApproveAnnouncement(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  return isCentreHead(user, settings) || isEventsHeadGgCampus(user) || user.tier === 1 || user.tier === 2.5;
}

export function canRemoveGuestContact(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isCentreHead(user, settings) || user?.tier === 1;
}

export function canDeleteForms(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isCentreHead(user, settings) || user?.tier === 1;
}

export function canDeleteEvent(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isBaseLeadership(user, settings);
}

export function canDeleteTask(user: ServerUser, settings: AccessLevelSettings, task?: any): boolean {
  if (isBaseLeadership(user, settings)) return true;
  if (task && user?.name && task.creatorName === user.name) return true;
  return false;
}

export function canManageBackup(user: ServerUser): boolean {
  return user?.tier === 1;
}

export function canManageEmailSettings(user: ServerUser, settings: AccessLevelSettings): boolean {
  return user?.tier === 1 || isCentreHead(user, settings);
}

export function canManageGuestInvites(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isCentreHead(user, settings);
}

export function canReviewEventReports(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isCentreHead(user, settings) || isEventsHeadGgCampus(user);
}

export function canReviewDesignProofread(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isCentreHead(user, settings) || isEventsHeadGgCampus(user);
}

export function isSuperUser(user: ServerUser): boolean {
  return user?.tier === 1;
}

// --- Events / Tasks / Ratings composite checks (ported from permissions.ts) ---

export type ServerTask = {
  id?: string;
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
  return isBaseLeadership(user, settings) || isCoreCommitteeTier(user, settings) || isHeadRole(user, settings);
}

/** Event editing baseline — same as canCreateEvent. Ported from permissions.ts's canEditEvent (Group Policy moduleAccess/hasCapability override out of scope). */
export function canEditEvent(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isBaseLeadership(user, settings) || isCoreCommitteeTier(user, settings) || isHeadRole(user, settings);
}

/** Task creation baseline — leadership, Core Committee, or any Head role. Ported from permissions.ts's canCreateTask (Group Policy TASKS_CREATE grant out of scope). */
export function canCreateTask(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isBaseLeadership(user, settings) || isCoreCommitteeTier(user, settings) || isHeadRole(user, settings);
}

/** Task editing baseline — same as canCreateTask. Ported from permissions.ts's canEditTask (Group Policy moduleAccess/hasCapability override out of scope). */
export function canEditTask(user: ServerUser, settings: AccessLevelSettings): boolean {
  return isBaseLeadership(user, settings) || isCoreCommitteeTier(user, settings) || isHeadRole(user, settings);
}

/**
 * Who may actually change a task's status — acknowledge it or mark it
 * complete. Ported from permissions.ts's canChangeTaskStatus: the assignee
 * themselves, the Centre Head, either campus's Head of Events, or the Super
 * User. Async because isTaskAssignee's committee branch needs the events
 * collection.
 */
export async function canChangeTaskStatus(task: ServerTask, user: ServerUser, settings: AccessLevelSettings): Promise<boolean> {
  if (!user) return false;
  if (user.tier === 1) return true;
  if (isCentreHead(user, settings)) return true;
  if (isHeadOfEvents(user) || isEventsHeadGgCampus(user) || isEventsHeadRtcCampus(user)) return true;
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
export function canEvaluateEventStudent(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user) return false;
  return isCentreHead(user, settings) || isEventsHeadGgCampus(user) || user.tier === 2.5;
}

/**
 * Rating edit/delete permission: the rating's own author, Centre Head, or
 * the Super User. Ported from permissions.ts's canEditRating (Group Policy
 * RATING_EDIT_ANY grant / moduleAccess.RATINGS.edit override out of scope).
 */
export function canEditRating(rating: ServerRating, user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user || !rating) return false;
  const isAuthor = user.name === rating.raterName;
  return user.tier === 1 || isAuthor || isCentreHead(user, settings);
}

// --- Designs / Forms / Announcements / Guests / Event Reports (ported from
// permissions.ts's built-in tier/role clauses; Group Policy capability and
// moduleAccess override clauses are intentionally NOT ported here, per this
// file's header). ---

/** Check if user is in the Faculty division. Ported from permissions.ts's isFaculty. */
export function isFaculty(user: ServerUser): boolean {
  return !!user && (user as any).division === 'Faculty';
}

/**
 * Design Portal visibility / edit-any-submission gate. Ported from
 * permissions.ts's canViewAllDesigns (built-in clause only: alumni/executive
 * excluded; base leadership or Design Head granted).
 */
export function canViewAllDesigns(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isAlumniRole(user) || isExecutiveRole(user)) return false;
  return isBaseLeadership(user, settings) || isDesignHead(user, settings);
}

/**
 * Form builder access. Ported from permissions.ts's canBuildForms (built-in
 * clause only): tier 1 or 5, any Head role, or an Executive role.
 */
export function canBuildForms(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isAlumniRole(user)) return false;
  return (!!user && (user.tier === 1 || user.tier === 5)) || isHeadRole(user, settings) || isExecutiveRole(user);
}

/**
 * Announcement authoring. Ported from permissions.ts's canCreateAnnouncement
 * (built-in clause only): base leadership, Core Committee, tier 4/5, Faculty,
 * or any Head role.
 */
export function canCreateAnnouncement(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (!user || isAlumniRole(user)) return false;
  return isBaseLeadership(user, settings) || isCoreCommitteeTier(user, settings) || user.tier === 4 || user.tier === 5 || isFaculty(user) || isHeadRole(user, settings);
}

/**
 * Guest Directory (visiting-card contacts) access. Ported from
 * permissions.ts's canAccessGuestDirectory (built-in clause only): Centre
 * Head, Faculty, or an Executive role.
 */
export function canAccessGuestDirectory(user: ServerUser, settings: AccessLevelSettings): boolean {
  if (isAlumniRole(user)) return false;
  return isCentreHead(user, settings) || isFaculty(user) || isExecutiveRole(user);
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
