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
import { Member, TaskItem, RatingItem, ReimbursementItem, GroupPolicy, getMembers, getGroupPolicies, canViewTask } from './local-data';

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

/** True for any member whose role string contains the word "Head" (case-insensitive) —
 *  covers "Head of Events", "Logistics Head", "Head Design and Social Media", "Centre Head", etc. */
export function isHeadRole(user: SessionUser): boolean {
  const role = (user as any)?.role;
  return !!user && typeof role === 'string' && /\bhead\b/i.test(role);
}

/** Check if user holds the tag of Sector Head (Centre Head / Sector Head / Department Head / Base Leadership). */
export function isSectorHead(user: SessionUser): boolean {
  if (!user) return false;
  const role = (user as any)?.role || '';
  const isSectorOrCentreHead = /\b(sector|centre|center)\s+head\b/i.test(role);
  const isGeneralHead = isHeadRole(user) && !/\bfinance\b/i.test(role);
  return user.tier <= 2 || isSectorOrCentreHead || isGeneralHead || hasCapability(user, 'APPROVE_REIMBURSEMENTS_SECTOR');
}

/** Check if user holds the tag of Finance Head (Finance Head / Finance Lead / Finance Department). */
export function isFinanceHead(user: SessionUser): boolean {
  if (!user) return false;
  const role = (user as any)?.role || '';
  const dept = user.department || resolveMember(user)?.department || '';
  const isFinanceRole = /\bfinance\b/i.test(role);
  const isFinanceDept = /\bfinance\b/i.test(dept);
  return user.tier === 1 || isFinanceRole || isFinanceDept || hasCapability(user, 'APPROVE_REIMBURSEMENTS_FINANCE');
}

/** Tier 1-3: Super User, Centre Head, Head of Events — full organizational access. */
export function isBaseLeadership(user: SessionUser): boolean {
  return !!user && user.tier <= 3;
}

/** Tier 5: Core Committee. */
export function isCoreCommitteeTier(user: SessionUser): boolean {
  return !!user && user.tier === 5;
}

/** Tier 6: Training Associate (base tier). */
export function isTrainingAssociateTier(user: SessionUser): boolean {
  return !!user && user.tier === 6;
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
 * A fixed catalog of grantable capabilities. Every capability key here maps
 * 1:1 to an existing `can*` check below via `hasCapability()`, so a Group
 * Policy tag granting e.g. "MANAGE_TASKS_EVENTS" has the exact same effect
 * as the hardcoded tier/role rules already covering that action — it's an
 * additional grant path, never a replacement for the existing rules.
 */
export const CAPABILITY_CATALOG: { key: string; label: string; description: string }[] = [
  { key: 'MANAGE_TASKS_EVENTS', label: 'Manage Tasks & Events', description: 'Create, edit, and delete tasks and events.' },
  { key: 'EDIT_DIRECTORY', label: 'Edit Member Directory', description: 'Add, edit, remove, and bulk-manage member records.' },
  { key: 'VIEW_FULL_DIRECTORY', label: 'View Full Directory', description: 'See the entire member roster, not just their own profile.' },
  { key: 'BUILD_FORMS', label: 'Build Public Forms', description: 'Create and edit public-facing forms.' },
  { key: 'CREATE_ANNOUNCEMENT', label: 'Publish Announcements', description: 'Author and publish announcements to a chosen scope.' },
  { key: 'VIEW_ALL_DESIGNS', label: 'View All Design Submissions', description: 'See every submission in the Design Portal, not just their own.' },
  { key: 'APPROVE_REIMBURSEMENTS_SECTOR', label: 'Approve Reimbursements (Sector Head stage)', description: 'First-pass reimbursement review and approval.' },
  { key: 'APPROVE_REIMBURSEMENTS_FINANCE', label: 'Approve Reimbursements (Finance Head stage)', description: 'Final-stage reimbursement approval.' },
];

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
  const policies = getGroupPolicies().filter(p => p.enabled !== false);
  return policies.some(p => p.capabilities?.includes(capability) && memberMatchesPolicy(member, p));
}

/** Sector Head first-stage approval permission. */
export function canApproveAsSectorHead(user: SessionUser): boolean {
  return isSectorHead(user);
}

/** Finance Head second-stage approval permission. */
export function canApproveAsFinanceHead(user: SessionUser): boolean {
  return isFinanceHead(user);
}

/** Backwards-compatibility wrapper for first-pass (Sector Head) review. */
export function canReviewReimbursementFirstPass(user: SessionUser): boolean {
  return isSectorHead(user);
}

/** Backwards-compatibility wrapper for final (Finance Head) approval. */
export function canApproveReimbursementFinal(user: SessionUser): boolean {
  return isFinanceHead(user);
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

/** Tasks/events creation & management — leadership, Core Committee, and any Head (incl. tier-3 Heads). */
export function canManageTasksAndEvents(user: SessionUser): boolean {
  return isBaseLeadership(user) || isCoreCommitteeTier(user) || isHeadRole(user) || hasCapability(user, 'MANAGE_TASKS_EVENTS');
}

/**
 * Extended task visibility: wraps the existing `canViewTask` (individual assignee /
 * event-committee membership) and adds department-scoped visibility for Heads, so a
 * Head sees every task assigned to a member of their own department, not just tasks
 * they personally own or committees they sit on.
 */
export function canViewTaskExtended(task: TaskItem, user: SessionUser): boolean {
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

/**
 * Rating visibility: leadership sees everything; a Head sees ratings for members of
 * their own department (their "team"); everyone else sees only ratings given to them.
 */
export function canViewRating(rating: RatingItem, user: SessionUser): boolean {
  if (!user) return false;
  if (isBaseLeadership(user)) return true;

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
  return !!user && (user.tier <= 5 || isHeadRole(user) || hasCapability(user, 'VIEW_FULL_DIRECTORY'));
}

/** Roster CRUD (add/edit/remove/bulk-edit members) — base leadership, or an explicit Group Policy grant. */
export function canEditDirectory(user: SessionUser): boolean {
  return isBaseLeadership(user) || hasCapability(user, 'EDIT_DIRECTORY');
}

/** Form builder access — existing convention (tier 1 or tier 5), plus any Head regardless of tier. */
export function canBuildForms(user: SessionUser): boolean {
  return (!!user && (user.tier === 1 || user.tier === 5)) || isHeadRole(user) || hasCapability(user, 'BUILD_FORMS');
}

/** Announcement authoring — leadership, Core Committee, and Heads. */
export function canCreateAnnouncement(user: SessionUser): boolean {
  return isBaseLeadership(user) || isCoreCommitteeTier(user) || isHeadRole(user) || hasCapability(user, 'CREATE_ANNOUNCEMENT');
}

/**
 * Design Portal visibility: a plain Design submitter only sees their own uploads
 * (plus anything explicitly assigned to them to proofread — handled separately in
 * the page's own "proofread" tab). Leadership and any Head see every submission.
 */
export function canViewAllDesigns(user: SessionUser): boolean {
  return isBaseLeadership(user) || isHeadRole(user) || hasCapability(user, 'VIEW_ALL_DESIGNS');
}

/**
 * Whether an announcement's target `scope` matches a given viewer — the canonical
 * implementation (and the recipient-set builder it shares logic with) lives in
 * announcement-scope.ts so both real email dispatch (server) and this per-viewer
 * relevance check can use the exact same scope-matching rules.
 */
export { getAnnouncementScopeMatch } from './announcement-scope';
