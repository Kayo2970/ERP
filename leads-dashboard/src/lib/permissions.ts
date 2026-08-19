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
import { Member, TaskItem, RatingItem, getMembers, canViewTask } from './local-data';

export type SessionUser = {
  id?: string;
  name: string;
  email: string;
  tier: number;
  division?: string;
  committee?: string;
  department?: string;
} | null | undefined;

/** True for any member whose role string contains the word "Head" (case-insensitive) —
 *  covers "Head of Events", "Logistics Head", "Head Design and Social Media", "Centre Head", etc. */
export function isHeadRole(user: SessionUser): boolean {
  const role = (user as any)?.role;
  return !!user && typeof role === 'string' && /\bhead\b/i.test(role);
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

/** Resolve the full Member record for a session user (persona objects are a subset of Member).
 *  Takes the already-fetched members array so callers that also need it for a second lookup
 *  (e.g. the task/rating target) don't pay for a second localStorage read + parse. */
function resolveMember(user: SessionUser, members: Member[]): Member | undefined {
  if (!user) return undefined;
  return (
    (user.id && members.find(m => m.id === user.id)) ||
    members.find(m => m.email.toLowerCase() === user.email.toLowerCase())
  );
}

/**
 * Reimbursement first-pass review (Core Committee triage before leadership's final call).
 * Heads submit reimbursement requests like anyone else, but do not get first-pass review
 * rights just because they happen to sit at tier 5 — that stays with non-Head Core Committee.
 */
export function canReviewReimbursementFirstPass(user: SessionUser): boolean {
  return isCoreCommitteeTier(user) && !isHeadRole(user);
}

/** Final approve/deny — stays with base leadership (tier <= 3), unchanged. */
export function canApproveReimbursementFinal(user: SessionUser): boolean {
  return isBaseLeadership(user);
}

/** Tasks/events creation & management — leadership, Core Committee, and any Head (incl. tier-3 Heads). */
export function canManageTasksAndEvents(user: SessionUser): boolean {
  return isBaseLeadership(user) || isCoreCommitteeTier(user) || isHeadRole(user);
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

  const members = getMembers();
  const department = user.department || resolveMember(user, members)?.department;
  if (!department) return false;

  if (task.assigneeType === 'individual') {
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
    const members = getMembers();
    const department = user.department || resolveMember(user, members)?.department;
    if (!department) return false;
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
  return !!user && (user.tier <= 5 || isHeadRole(user));
}

/** Roster CRUD (add/edit/remove/bulk-edit members) — unchanged, base leadership only. */
export function canEditDirectory(user: SessionUser): boolean {
  return isBaseLeadership(user);
}

/** Form builder access — existing convention (tier 1 or tier 5), plus any Head regardless of tier. */
export function canBuildForms(user: SessionUser): boolean {
  return (!!user && (user.tier === 1 || user.tier === 5)) || isHeadRole(user);
}

/** Announcement authoring — leadership, Core Committee, and Heads. */
export function canCreateAnnouncement(user: SessionUser): boolean {
  return isBaseLeadership(user) || isCoreCommitteeTier(user) || isHeadRole(user);
}

/**
 * Design Portal visibility: a plain Design submitter only sees their own uploads
 * (plus anything explicitly assigned to them to proofread — handled separately in
 * the page's own "proofread" tab). Leadership and any Head see every submission.
 */
export function canViewAllDesigns(user: SessionUser): boolean {
  return isBaseLeadership(user) || isHeadRole(user);
}

/**
 * Whether an announcement's target `scope` matches a given viewer, for scoping
 * notifications/lists to "things relevant to me" (base tier only receives their own
 * division's + all-members announcements; this mirrors the existing scope values).
 */
export function getAnnouncementScopeMatch(scope: string, user: SessionUser): boolean {
  if (!user) return false;
  if (!scope || scope === 'All Members') return true;
  if (isBaseLeadership(user)) return true;
  return scope === user.division || scope === user.committee;
}
