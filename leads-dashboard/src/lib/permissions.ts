/**
 * permissions.ts — Centralized role/access checks for the LEADS dashboard.
 *
 * Built on top of the real data model already in production:
 *   - `Member.tier` (1 = Super User ... 7 = Alumni)
 *   - `Member.division` ('Advisory Board' | 'Core Committee' | 'Training Associate' | 'Alumni')
 *   - `Member.department` (real department name, e.g. "Design and Social Media")
 *   - "Head" designation expressed as a role-string convention: any role containing
 *     the word "Head" (e.g. "Head of Events", "Logistics Head", "Head Design and
 *     Social Media") — there is no separate designations array.
 *
 * There is no session-scoped "current user" object here; every function takes the
 * user explicitly so it works the same in pages, modals, and background sync code.
 */
import { Member, TaskItem, RatingItem, ReimbursementItem, GroupPolicy, EventItem, getMembers, getGroupPolicies, getAccessLevelSettings, canViewTask } from './local-data';

export type SessionUser = {
  id?: string;
  name: string;
  email: string;
  tier: number;
  division?: string;
  committee?: string;
  department?: string;
  role?: string;
} | null | undefined;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Check if user holds an executive role: President, Vice President, or Chief Coordinator. */
export function isExecutiveRole(user: SessionUser): boolean {
  if (!user) return false;
  const role = ((user as any)?.role || '').toLowerCase();
  return role.includes('president') || role.includes('vice president') || role.includes('chief coordinator');
}

/** Check if user holds Alumni role/tier. */
export function isAlumniRole(user: SessionUser): boolean {
  if (!user) return false;
  const division = ((user as any)?.division || '').toLowerCase();
  const role = ((user as any)?.role || '').toLowerCase();
  return user.tier === 7 || division.includes('alumni') || role.includes('alumni');
}

/** Build a whole-word, case-insensitive matcher for one configured keyword. */
function keywordMatches(text: string, keyword: string): boolean {
  const kw = keyword.trim();
  if (!kw) return false;
  return new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i').test(text);
}

/** Build a whole-word, case-insensitive matcher for a comma-separated list of phrases. */
function anyKeywordMatches(text: string, keywords: string): boolean {
  return keywords
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .some(k => new RegExp(`\\b${escapeRegex(k)}\\b`, 'i').test(text));
}

/**
 * True for any member whose role string contains the configured "Head"
 * keyword (default "head", whole-word, case-insensitive) — covers "Head of
 * Events", "Logistics Head", "Head Design and Social Media", "Centre Head",
 * etc. The keyword itself is editable by the Super User (see
 * getAccessLevelSettings / the Group Policies page's Built-in Access Rules
 * panel) instead of being fixed in code.
 */
export function isHeadRole(user: SessionUser): boolean {
  const role = (user as any)?.role;
  if (!user || typeof role !== 'string') return false;
  return keywordMatches(role, getAccessLevelSettings().headKeyword);
}

/** Check if user holds the tag of Sector Head (Centre Head / Sector Head / Department Head / Base Leadership). */
export function isSectorHead(user: SessionUser): boolean {
  if (!user) return false;
  const role = (user as any)?.role || '';
  const settings = getAccessLevelSettings();
  const isSectorOrCentreHead = anyKeywordMatches(role, settings.sectorHeadKeywords);
  const isGeneralHead = isHeadRole(user) && !keywordMatches(role, settings.financeKeyword);
  return user.tier <= settings.sectorHeadMaxTier || isSectorOrCentreHead || isGeneralHead || hasCapability(user, 'APPROVE_REIMBURSEMENTS_SECTOR');
}

/** Check if user holds the tag of Finance Head (Finance Head / Finance Lead / Finance Department). */
export function isFinanceHead(user: SessionUser): boolean {
  if (!user) return false;
  const role = (user as any)?.role || '';
  const dept = user.department || resolveMember(user)?.department || '';
  const financeKeyword = getAccessLevelSettings().financeKeyword;
  const isFinanceRole = keywordMatches(role, financeKeyword);
  const isFinanceDept = keywordMatches(dept, financeKeyword);
  // tier === 1 (the true Super User) is deliberately hardcoded, never configurable —
  // see AccessLevelSettings' doc comment for why.
  return user.tier === 1 || isFinanceRole || isFinanceDept || hasCapability(user, 'APPROVE_REIMBURSEMENTS_FINANCE');
}

/** Base leadership: tier <= the configured threshold (default 3) — Super User, Centre Head, Head of Events. */
export function isBaseLeadership(user: SessionUser): boolean {
  return !!user && user.tier <= getAccessLevelSettings().baseLeadershipMaxTier;
}

/** Core Committee: tier === the configured value (default 5). */
export function isCoreCommitteeTier(user: SessionUser): boolean {
  return !!user && user.tier === getAccessLevelSettings().coreCommitteeTier;
}

/** Check if user is Centre Head (Super User tier 1, or tier <= 2 / Centre Head / Advisor designation). */
export function isCentreHead(user: SessionUser): boolean {
  if (!user) return false;
  if (user.tier === 1) return true;
  const role = ((user as any)?.role || '').toLowerCase();
  const settings = getAccessLevelSettings();
  return user.tier <= settings.sectorHeadMaxTier || anyKeywordMatches(role, settings.sectorHeadKeywords) || role.includes('advisor');
}

/** Check if user holds the designation of Head of Events (or Events Head). */
export function isHeadOfEvents(user: SessionUser): boolean {
  if (!user) return false;
  const role = ((user as any)?.role || '').toLowerCase();
  return role.includes('head of event') || role.includes('head of events') || role.includes('events head');
}

/** Check if user is Events Head for GG Campus or holds Tier 2.5 leadership. */
export function isEventsHeadGgCampus(user: SessionUser): boolean {
  if (!user) return false;
  if (user.tier === 2.5) return true;
  const role = ((user as any)?.role || '').toLowerCase();
  const committee = ((user as any)?.committee || '').toLowerCase();
  return (role.includes('events head') && role.includes('gg')) || 
         (role.includes('head of events') && role.includes('gg')) ||
         (role.includes('events') && role.includes('gg campus')) ||
         (committee.includes('gg campus') && isHeadOfEvents(user));
}

/** Check if user is Events Head for RTC Campus. */
export function isEventsHeadRtcCampus(user: SessionUser): boolean {
  if (!user) return false;
  const role = ((user as any)?.role || '').toLowerCase();
  const committee = ((user as any)?.committee || '').toLowerCase();
  return (role.includes('events head') && role.includes('rtc')) || 
         (role.includes('head of events') && role.includes('rtc')) ||
         (role.includes('events') && role.includes('rtc campus')) ||
         (committee.includes('rtc campus') && isHeadOfEvents(user));
}

/**
 * Strict evaluation rule enforcement:
 * 1) Centre Head & GG Campus Event Head (Tier 2.5) can evaluate across both campuses.
 * 2) RTC Events Head evaluates RTC events ONLY and is strictly blocked from GG events.
 * 3) A Design Portal deliverable task (`isDesignDeliverable`) is a separate lane —
 *    it isn't tied to campus-scoped event committee work, so the Design Head who
 *    actually approved/finalized the design can also rate it, regardless of the
 *    campus-based rules above (which otherwise only recognize Centre Head/Head of
 *    Events, locking every Design Head out of their own team's deliverables).
 */
export function canEvaluateEventStudent(user: SessionUser, eventCampus?: string, isDesignDeliverable?: boolean): boolean {
  if (!user || isAlumniRole(user)) return false;
  if (isDesignDeliverable && isDesignHead(user)) return true;

  const centreHead = isCentreHead(user);
  const isGgHead = isEventsHeadGgCampus(user) || user.tier === 2.5;
  const isRtcHead = isEventsHeadRtcCampus(user);
  const eventsHead = isHeadOfEvents(user);

  if (!centreHead && !eventsHead && !isGgHead) return false;
  if (centreHead || isGgHead) return true;

  if (eventCampus === 'GG Campus') {
    return false; // RTC Head cannot evaluate GG events
  }

  if (eventCampus === 'RTC Campus') {
    return isRtcHead || eventsHead;
  }

  return eventsHead;
}

/** Check if user is a Design Head (Head role + Design department/role). */
export function isDesignHead(user: SessionUser): boolean {
  if (!user) return false;
  if (user.tier <= 2) return true; // Super User and Centre Head have design review authority
  const role = ((user as any)?.role || '').toLowerCase();
  const dept = (user.department || resolveMember(user)?.department || '').toLowerCase();
  const isDesign = role.includes('design') || dept.includes('design');
  return isHeadRole(user) && isDesign;
}

/** Resolve the full Member record for a session user (persona objects are a subset of Member). */
function resolveMember(user: SessionUser): Member | undefined {
  if (!user) return undefined;
  const members = getMembers();
  return (
    (user.id && members.find(m => m.id === user.id)) ||
    members.find(m => m.email.toLowerCase() === user.email.toLowerCase())
  );
}

/**
 * Group Policy Management — dynamic, Super User-managed access control.
 *
 * A fixed catalog of grantable capabilities, split at resource+action grain
 * (Events and Tasks each get CREATE/EDIT/DELETE/VIEW_ALL) so a policy can grant
 * exactly one slice of access — e.g. "create events" without also granting
 * "delete events" or "view everyone's events." Every capability key here maps
 * to an existing `can*` check below via `hasCapability()`, so a Group Policy
 * grant has the exact same effect as the hardcoded tier/role rules already
 * covering that action — it's an additional grant path, never a replacement.
 */
export const CAPABILITY_CATALOG: { key: string; label: string; description: string }[] = [
  { key: 'EVENTS_CREATE', label: 'Create Events', description: 'Create new events and their sub-committees.' },
  { key: 'EVENTS_EDIT', label: 'Edit Events', description: "Edit any existing event's details." },
  { key: 'EVENTS_DELETE', label: 'Delete Events', description: 'Delete any event.' },
  { key: 'EVENTS_VIEW_ALL', label: 'View All Events', description: 'See every event, not just ones created by or listing this person.' },
  { key: 'TASKS_CREATE', label: 'Create Tasks', description: 'Assign new tasks to individuals or committees.' },
  { key: 'TASKS_EDIT', label: 'Edit Tasks', description: 'Edit any existing task.' },
  { key: 'TASKS_DELETE', label: 'Delete Tasks', description: 'Delete any task.' },
  { key: 'TASKS_VIEW_ALL', label: 'View All Tasks', description: "See every task, not just this person's own or their department's." },
  { key: 'EDIT_DIRECTORY', label: 'Edit Member Directory', description: 'Add, edit, remove, and bulk-manage member records.' },
  { key: 'VIEW_FULL_DIRECTORY', label: 'View Full Directory', description: 'See the entire member roster, not just their own profile.' },
  { key: 'BUILD_FORMS', label: 'Build Public Forms', description: 'Create and edit public-facing forms.' },
  { key: 'CREATE_ANNOUNCEMENT', label: 'Publish Announcements', description: 'Author and publish announcements to a chosen scope.' },
  { key: 'VIEW_ALL_DESIGNS', label: 'View All Design Submissions', description: 'See every submission in the Design Portal, not just their own.' },
  { key: 'APPROVE_REIMBURSEMENTS_SECTOR', label: 'Approve Reimbursements (Sector Head stage)', description: 'First-pass reimbursement review and approval.' },
  { key: 'APPROVE_REIMBURSEMENTS_FINANCE', label: 'Approve Reimbursements (Finance Head stage)', description: 'Final-stage reimbursement approval.' },
];

/** True if a policy is enabled and, when it has an expiry date, hasn't passed it yet. */
function isPolicyActive(policy: GroupPolicy): boolean {
  if (policy.enabled === false) return false;
  if (policy.expiresAt && policy.expiresAt <= new Date().toISOString()) return false;
  return true;
}

/** True if a member satisfies ANY of a policy's non-empty target criteria. */
function memberMatchesPolicy(member: Member, policy: GroupPolicy): boolean {
  if (policy.targetMemberIds?.includes(member.id)) return true;
  if (policy.targetDivisions?.length && policy.targetDivisions.includes(member.division)) return true;
  if (policy.targetTiers?.length && policy.targetTiers.includes(member.tier)) return true;
  if (policy.targetDesignationKeyword?.trim()) {
    const kw = policy.targetDesignationKeyword.trim().toLowerCase();
    if ((member.role || '').toLowerCase().includes(kw)) return true;
  }
  return false;
}

/**
 * Resolve whether `user` currently holds `capability` through any enabled
 * Group Policy tag whose targeting matches them. Super User (tier 1) always
 * has every capability implicitly and never needs an explicit policy.
 */
export function hasCapability(user: SessionUser, capability: string): boolean {
  if (!user) return false;
  if (user.tier === 1) return true;
  const member = resolveMember(user);
  if (!member) return false;
  const policies = getGroupPolicies().filter(isPolicyActive);
  return policies.some(p => p.capabilities?.includes(capability) && memberMatchesPolicy(member, p));
}

export interface ApprovalRequirement {
  requiresApproval: boolean;
  approverType?: GroupPolicy['approverType'];
  approverMemberId?: string;
  approverPolicyTagId?: string;
  approverName?: string; // human-readable, for the "submitted for approval from X" toast
  policyName?: string;
}

function resolveApproverName(policy: GroupPolicy): string {
  if (policy.approverType === 'SPECIFIC_MEMBER' && policy.approverMemberId) {
    return getMembers().find(m => m.id === policy.approverMemberId)?.name || 'the designated approver';
  }
  if (policy.approverType === 'POLICY_TAG' && policy.approverPolicyTagId) {
    const tagPolicy = getGroupPolicies().find(p => p.id === policy.approverPolicyTagId);
    return tagPolicy ? `anyone holding "${tagPolicy.name}"` : 'the designated approver';
  }
  return 'the Center Head';
}

/**
 * Whether `user` acting under `capability` needs sign-off before their action takes
 * effect, and who from. `builtInGranted` is whether the user already has this
 * capability through a hardcoded tier/role rule (in which case approval never
 * applies — approval only ever gates access that came SOLELY from a policy tag).
 * If the user holds the capability through multiple matching policies and at least
 * one of them doesn't require approval, that non-approval grant wins (the more
 * permissive path is used) — approval is only imposed when EVERY grant path demands it.
 */
export function getApprovalRequirement(user: SessionUser, capability: string, builtInGranted: boolean): ApprovalRequirement {
  if (builtInGranted || !user) return { requiresApproval: false };
  const member = resolveMember(user);
  if (!member) return { requiresApproval: false };

  const policies = getGroupPolicies().filter(
    p => isPolicyActive(p) && p.capabilities?.includes(capability) && memberMatchesPolicy(member, p)
  );
  if (policies.length === 0) return { requiresApproval: false };
  if (policies.some(p => !p.requiresApproval)) return { requiresApproval: false };

  const policy = policies[0];
  return {
    requiresApproval: true,
    approverType: policy.approverType || 'CENTER_HEAD',
    approverMemberId: policy.approverMemberId,
    approverPolicyTagId: policy.approverPolicyTagId,
    approverName: resolveApproverName(policy),
    policyName: policy.name,
  };
}

/** Sector Head first-stage approval permission. */
export function canApproveAsSectorHead(user: SessionUser): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isSectorHead(user);
}

/** Centre Head first-stage verification permission for reimbursement claims. */
export function canVerifyReimbursementCentreHead(user: SessionUser): boolean {
  return isCentreHead(user) || user?.tier === 1;
}

/** Finance Head second-stage approval permission for reimbursement claims. */
export function canApproveAsFinanceHead(user: SessionUser, claim?: ReimbursementItem): boolean {
  if (!user || !isFinanceHead(user) || isExecutiveRole(user) || isAlumniRole(user)) return false;
  if (user.tier === 1 || isCentreHead(user)) return true;
  if (!claim) return true;
  return claim.centreHeadVerified === true || claim.status === 'Verified by Centre Head' || claim.status === 'Under Review';
}

/** Announcement approval gatekeeper — Centre Head or GG Campus Events Head (Tier 2.5). */
export function canApproveAnnouncement(user: SessionUser): boolean {
  if (!user) return false;
  return isCentreHead(user) || isEventsHeadGgCampus(user) || user.tier === 1 || user.tier === 2.5;
}

/**
 * Visibility rule for reimbursement claims:
 * - Claimant sees their own claims.
 * - Super User sees all.
 * - Sector Head sees all claims (including 'Pending' claims awaiting Sector Head approval).
 * - Finance Head sees claims ONLY AFTER Sector Head has approved them ('Under Review', 'Approved', 'Denied').
 *   Pending claims do NOT reflect on Finance Head's dashboard until Sector Head approves!
 */
export function canViewReimbursement(claim: ReimbursementItem, user: SessionUser): boolean {
  if (!user) return false;

  // Claimant always sees their own claims
  if (user.email && claim.memberEmail.toLowerCase() === user.email.toLowerCase()) {
    return true;
  }

  // Super User sees all
  if (user.tier === 1) return true;

  // Sector Head sees all claims, including stage-1 Pending claims
  if (isSectorHead(user)) return true;

  // Finance Head sees claims ONLY AFTER Sector Head approval ('Under Review', 'Approved', 'Denied')
  if (isFinanceHead(user)) {
    return claim.status !== 'Pending';
  }

  return false;
}

/** Event creation — leadership, Core Committee, any Head, or an EVENTS_CREATE grant. */
export function canCreateEvent(user: SessionUser): boolean {
  return isBaseLeadership(user) || isCoreCommitteeTier(user) || isHeadRole(user) || hasCapability(user, 'EVENTS_CREATE');
}

/** Event editing — same baseline as creation, or an EVENTS_EDIT grant. */
export function canEditEvent(user: SessionUser): boolean {
  return isBaseLeadership(user) || isCoreCommitteeTier(user) || isHeadRole(user) || hasCapability(user, 'EVENTS_EDIT');
}

/** Event deletion — base leadership only by default, or an EVENTS_DELETE grant. */
export function canDeleteEvent(user: SessionUser): boolean {
  return isBaseLeadership(user) || hasCapability(user, 'EVENTS_DELETE');
}

/** Umbrella check for "can this user manage events at all" — gates the events UI's
 *  create button and per-row edit/delete affordances the same way the old single
 *  canManageTasksAndEvents() did, now backed by the finer create/edit/delete checks. */
export function canManageEvents(user: SessionUser): boolean {
  return canCreateEvent(user) || canEditEvent(user) || canDeleteEvent(user);
}

/**
 * Per-event visibility. The DEFAULT is unchanged from before this feature existed —
 * every member sees every event — UNLESS the Super User has explicitly created a
 * Group Policy targeting this member with `eventVisibilityScope: 'OWN_ONLY'`, in
 * which case they only see events they created or are listed on a committee for.
 * This is deliberately restrictive-by-opt-in only: nothing narrows for anyone until
 * a policy is built for them, so existing behavior never regresses on its own.
 */
export function canViewEvent(event: EventItem, user: SessionUser): boolean {
  if (!user) return false;

  const isRtcHead = isEventsHeadRtcCampus(user);
  const isGgHead = isEventsHeadGgCampus(user) || user.tier === 2.5;

  // Asymmetric restriction: RTC Head cannot view GG Campus events
  if (event.campus === 'GG Campus' && isRtcHead && !isGgHead && !isCentreHead(user) && user.tier !== 1) {
    return false;
  }

  if (isBaseLeadership(user) || isHeadRole(user) || user.tier === 2.5 || hasCapability(user, 'EVENTS_VIEW_ALL')) return true;

  const member = resolveMember(user);
  if (!member) return true;

  const policies = getGroupPolicies().filter(p => isPolicyActive(p) && memberMatchesPolicy(member, p));
  const restricting = policies.find(p => p.eventVisibilityScope === 'OWN_ONLY');
  if (!restricting) return true;

  if (event.createdBy && (event.createdBy === user.name || event.createdBy === user.email)) return true;
  return (event.committees || []).some(c => (c.memberIds || []).includes(member.id));
}

/** Whether `user` acting under `action` (create/edit) needs approval, and from whom. */
export function getEventApprovalRequirement(user: SessionUser, action: 'CREATE' | 'EDIT'): ApprovalRequirement {
  if (isExecutiveRole(user) && !isCentreHead(user) && user?.tier !== 1) {
    return {
      requiresApproval: true,
      approverType: 'CENTER_HEAD',
      approverName: 'the Center Head',
      policyName: 'Executive Event Sign-off Requirement'
    };
  }
  const capability = action === 'CREATE' ? 'EVENTS_CREATE' : 'EVENTS_EDIT';
  const builtIn = isBaseLeadership(user) || user?.tier === 2.5 || isCoreCommitteeTier(user) || isHeadRole(user);
  return getApprovalRequirement(user, capability, builtIn);
}

/** Whether `user` is the resolved approver for a specific pending event (create or edit). */
export function canApprovePendingEvent(event: EventItem, user: SessionUser): boolean {
  if (!user) return false;
  if (user.tier === 1) return true;
  if (event.approvalStatus !== 'pending_create' && event.approvalStatus !== 'pending_edit') return false;

  const member = resolveMember(user);
  if (!member) return false;

  if (event.approverType === 'SPECIFIC_MEMBER') return member.id === event.approverMemberId;
  if (event.approverType === 'POLICY_TAG' && event.approverPolicyTagId) {
    const tagPolicy = getGroupPolicies().find(p => p.id === event.approverPolicyTagId);
    return !!tagPolicy && memberMatchesPolicy(member, tagPolicy);
  }
  return isSectorHead(user); // CENTER_HEAD (default)
}

/** Task creation — leadership, Core Committee, any Head, or a TASKS_CREATE grant. */
export function canCreateTask(user: SessionUser): boolean {
  return isBaseLeadership(user) || isCoreCommitteeTier(user) || isHeadRole(user) || hasCapability(user, 'TASKS_CREATE');
}

/** Task editing — same baseline as creation, or a TASKS_EDIT grant. */
export function canEditTask(user: SessionUser): boolean {
  return isBaseLeadership(user) || isCoreCommitteeTier(user) || isHeadRole(user) || hasCapability(user, 'TASKS_EDIT');
}

/** Task deletion — base leadership only by default, or a TASKS_DELETE grant. */
export function canDeleteTask(user: SessionUser): boolean {
  return isBaseLeadership(user) || hasCapability(user, 'TASKS_DELETE');
}

/** Umbrella check replacing the old canManageTasksAndEvents() for the Tasks page. */
export function canManageTasks(user: SessionUser): boolean {
  return canCreateTask(user) || canEditTask(user) || canDeleteTask(user);
}

/**
 * Extended task visibility: wraps the existing `canViewTask` (individual assignee /
 * event-committee membership) and adds department-scoped visibility for Heads, so a
 * Head sees every task assigned to a member of their own department, not just tasks
 * they personally own or committees they sit on. A TASKS_VIEW_ALL grant sees every
 * task outright — purely additive, since Tasks already default to "own only" for
 * everyone without one of these grants.
 */
export function canViewTaskExtended(task: TaskItem, user: SessionUser): boolean {
  if (hasCapability(user, 'TASKS_VIEW_ALL')) return true;
  if (canViewTask(task as any, user as any)) return true;
  if (!user || !isHeadRole(user)) return false;

  const department = user.department || resolveMember(user)?.department;
  if (!department) return false;

  if (task.assigneeType === 'individual') {
    const members = getMembers();
    const assigneeMember = task.assigneeId
      ? members.find(m => m.id === task.assigneeId)
      : members.find(m =>
          (task.assigneeEmail && m.email.toLowerCase() === task.assigneeEmail.toLowerCase()) ||
          m.name.toLowerCase() === (task.assignee || '').toLowerCase()
        );
    return assigneeMember?.department === department;
  }

  return false;
}

/** Check if user is Dr. Subhadeep / Centre Head Leadership. */
export function isDrSubhadeep(user: SessionUser): boolean {
  if (!user) return false;
  const name = (user.name || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  return name.includes('subhadeep') || name.includes('subhadip') || name.includes('subhadeepmukherjee') || email.includes('subhadeep');
}

/**
 * Check if user is Kayomarz Pavri — the founding Super User (seeded as member
 * 'm1'). Identity-based (matches by id, name, or either of his known login
 * emails) rather than tier/role alone, so it keeps working even if his tier,
 * role string, or login email ever changes, and even as additional Super User
 * accounts are added that would otherwise be just as hidden from him as they
 * are from everyone else.
 */
export function isKayomarzPavri(user: SessionUser): boolean {
  if (!user) return false;
  const name = (user.name || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  return user.id === 'm1' || name.includes('kayomarz') || email === 'kayo2970@gmail.com' || email === 'kayo2970@outlook.com';
}

/**
 * Full, unrestricted account visibility — sees every member record, including
 * other Super User accounts that are otherwise hidden from the general
 * directory (see the Security & Privacy filter in the Directory page). Any
 * Super User already sees every other hidden account; Kayomarz Pavri gets
 * this by identity as well, so the override survives regardless of which
 * account/tier he's currently logged in under.
 */
export function canViewHiddenAccounts(user: SessionUser): boolean {
  if (!user) return false;
  return user.tier === 1 || user.role === 'Super User' || isKayomarzPavri(user);
}

/**
 * Rating & Report visibility: leadership, Centre Head, and Dr. Subhadeep Mukherjee see everything;
 * a Head sees ratings for members of their own department (their "team"); everyone else sees only ratings given to them.
 */
export function canViewRating(rating: RatingItem, user: SessionUser): boolean {
  if (!user) return false;
  if (isBaseLeadership(user) || isCentreHead(user) || isDrSubhadeep(user) || hasCapability(user, 'VIEW_ALL_REPORTS')) return true;

  const isOwn =
    rating.targetId === user.id ||
    rating.targetName.toLowerCase() === user.name.toLowerCase();
  if (isOwn) return true;

  if (isHeadRole(user)) {
    const department = user.department || resolveMember(user)?.department;
    if (!department) return false;
    const members = getMembers();
    const targetMember = members.find(m => m.id === rating.targetId) ||
      members.find(m => m.name.toLowerCase() === rating.targetName.toLowerCase());
    return targetMember?.department === department;
  }

  return false;
}

/**
 * Full member roster visibility: everyone tier <= 5 (Advisory Board through Core
 * Committee, which already covers every Head-role member seeded at tier 5, plus the
 * tier-3 "Head of Events" case). Training Associates (tier 6) and Alumni (tier 7) only
 * see their own profile.
 */
export function canViewFullDirectory(user: SessionUser): boolean {
  if (isAlumniRole(user)) return false;
  return !!user && (user.tier <= 5 || isHeadRole(user) || isExecutiveRole(user) || hasCapability(user, 'VIEW_FULL_DIRECTORY'));
}

/** Roster CRUD (add/edit/remove/bulk-edit members) — base leadership, or an explicit Group Policy grant. */
export function canEditDirectory(user: SessionUser): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isBaseLeadership(user) || hasCapability(user, 'EDIT_DIRECTORY');
}

/** Check if user can terminate members (Centre Head or Super User only). */
export function canTerminateMember(user: SessionUser): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isCentreHead(user) || user?.tier === 1;
}

/**
 * Directly set another member's password, taking effect immediately with no OTP
 * or self-setup step for them to complete. Deliberately Super User (tier 1) ONLY —
 * unlike most admin actions in this file, isCentreHead() is NOT accepted here.
 * Centre Head can still ask a member to set up their own password on next login
 * (see requestMemberPasswordReset), just not assign one directly.
 */
export function canSetMemberPassword(user: SessionUser): boolean {
  return user?.tier === 1;
}

/** Check if user is in the Faculty division. */
export function isFaculty(user: SessionUser): boolean {
  return !!user && user.division === 'Faculty';
}

/** Guest Directory (visiting-card contacts) — Centre Head, Faculty, and Executive Council. */
export function canAccessGuestDirectory(user: SessionUser): boolean {
  if (isAlumniRole(user)) return false;
  return isCentreHead(user) || isFaculty(user) || isExecutiveRole(user);
}

/** Check if user can delete contacts from guest directory. */
export function canRemoveGuestContact(user: SessionUser): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isCentreHead(user) || user?.tier === 1;
}

/** Form builder access — existing convention (tier 1 or tier 5), plus any Head regardless of tier. */
export function canBuildForms(user: SessionUser): boolean {
  if (isAlumniRole(user)) return false;
  return (!!user && (user.tier === 1 || user.tier === 5)) || isHeadRole(user) || isExecutiveRole(user) || hasCapability(user, 'BUILD_FORMS');
}

/** Check if user can delete public forms (Centre Head or Super User only). */
export function canDeleteForms(user: SessionUser): boolean {
  if (isExecutiveRole(user) || isAlumniRole(user)) return false;
  return isCentreHead(user) || user?.tier === 1;
}

/** Announcement authoring — Core Committee, Advisory Board, Faculty, Heads, Centre Head & GG Campus Events Head. */
export function canCreateAnnouncement(user: SessionUser): boolean {
  if (!user || isAlumniRole(user)) return false;
  return isBaseLeadership(user) || isCoreCommitteeTier(user) || user.tier === 4 || user.tier === 5 || isFaculty(user) || isHeadRole(user) || hasCapability(user, 'CREATE_ANNOUNCEMENT');
}

/**
 * Design Portal visibility: a plain Design submitter only sees their own uploads
 * (plus anything explicitly assigned to them to proofread — handled separately in
 * the page's own "proofread" tab). Leadership and any Head see every submission.
 */
export function canViewAllDesigns(user: SessionUser): boolean {
  if (isAlumniRole(user) || isExecutiveRole(user)) return false;
  return isBaseLeadership(user) || isDesignHead(user) || hasCapability(user, 'VIEW_ALL_DESIGNS');
}

/** Task extension request permission: own task or a team member in department (for Heads). */
export function canRequestTaskExtension(task: TaskItem, user: SessionUser): boolean {
  if (!user) return false;
  if (user.id && task.assigneeId === user.id) return true;
  if (user.email && task.assigneeEmail?.toLowerCase() === user.email.toLowerCase()) return true;
  if (user.name && task.assignee.toLowerCase() === user.name.toLowerCase()) return true;

  if (isHeadRole(user)) {
    const department = user.department || resolveMember(user)?.department;
    if (!department) return false;
    const members = getMembers();
    const assigneeMember = members.find(m => m.id === task.assigneeId || m.name.toLowerCase() === task.assignee.toLowerCase());
    return assigneeMember?.department === department;
  }
  return false;
}

/** Task extension approval/rejection: base leadership, or Faculty. */
export function canDecideTaskExtension(user: SessionUser): boolean {
  return isBaseLeadership(user) || isFaculty(user);
}

/**
 * Whether an announcement's target `scope` matches a given viewer — the canonical
 * implementation (and the recipient-set builder it shares logic with) lives in
 * announcement-scope.ts so both real email dispatch (server) and this per-viewer
 * relevance check can use the exact same scope-matching rules.
 */
export { getAnnouncementScopeMatch } from './announcement-scope';
