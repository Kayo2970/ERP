/**
 * Server-side Group Policy approval gate.
 *
 * A Group Policy can grant a capability but require that the grantee's action is signed off by a designated approver
 * before it takes effect (GroupPolicy.requiresApproval). That requirement used to be evaluated ONLY in the browser
 * (permissions.ts getApprovalRequirement, from a cached copy of the policies) and the API routes simply trusted the
 * flag the browser sent — so a stale cache, another client or a direct call applied the action immediately and no
 * request ever reached the Approvals module. This module decides it where it can't be skipped: on the server, from the
 * stored policies, for the signed-in actor.
 */
import { readCollection } from './server-db';
import { getAccessLevelSettingsServer, isBaseLeadership, isHeadRole, ServerUser } from './permissions-server';

export interface GateDecision {
  /** The actor may do this at all (a built-in grant, or a policy that grants the capability). */
  allowed: boolean;
  /** …but the action must wait for the designated approver. */
  requiresApproval: boolean;
  approverType?: 'CENTER_HEAD' | 'SPECIFIC_MEMBER' | 'POLICY_TAG';
  approverMemberId?: string;
  approverPolicyTagId?: string;
  approverName?: string;
  policyName?: string;
}

const NOT_ALLOWED: GateDecision = { allowed: false, requiresApproval: false };

function policyIsActive(p: any, now: string): boolean {
  if (p.enabled === false) return false;
  if (p.expiresAt && p.expiresAt <= now) return false;
  return true;
}

/** Same matching rules as permissions.ts memberMatchesPolicy / permissions-server hasCapabilityServer. */
export function policyTargetsUser(p: any, user: ServerUser): boolean {
  if (!user) return false;
  if (user.id && p.targetMemberIds?.includes(user.id)) return true;
  if (p.targetDivisions?.length && user.division && p.targetDivisions.includes(user.division)) return true;
  if (p.targetTiers?.length && typeof user.tier === 'number' && p.targetTiers.includes(user.tier)) return true;
  if (p.targetDesignationKeyword?.trim()) {
    const kw = p.targetDesignationKeyword.trim().toLowerCase();
    if ((user.role || '').toLowerCase().includes(kw)) return true;
  }
  return false;
}

async function approverNameFor(p: any): Promise<string> {
  if (p.approverType === 'SPECIFIC_MEMBER' && p.approverMemberId) {
    const members = await readCollection<any>('members');
    return members.find((m: any) => m.id === p.approverMemberId)?.name || 'the designated approver';
  }
  if (p.approverType === 'POLICY_TAG' && p.approverPolicyTagId) {
    const policies = await readCollection<any>('groupPolicies');
    const tag = policies.find((x: any) => x.id === p.approverPolicyTagId);
    return tag ? `members tagged "${tag.name}"` : 'the designated approvers';
  }
  return 'the Centre Head or Advisor';
}

/**
 * Decide whether `user` may use any of `capabilities`, and whether that use must be approved first.
 * `builtInGranted` = the actor already holds this power through a hard-coded tier / role rule — approval then never
 * applies (it only ever gates access that comes SOLELY from a policy tag). When several policies grant the capability
 * and any one of them needs no approval, that more permissive path wins — same rule as the client.
 */
export async function evaluateCapabilityGate(user: ServerUser, capabilities: string[], builtInGranted: boolean): Promise<GateDecision> {
  if (!user) return NOT_ALLOWED;
  if (user.tier === 1 || builtInGranted) return { allowed: true, requiresApproval: false };

  const now = new Date().toISOString();
  const policies = (await readCollection<any>('groupPolicies') || []).filter(
    (p: any) => policyIsActive(p, now) && policyTargetsUser(p, user) && capabilities.some((c) => p.capabilities?.includes(c))
  );
  if (policies.length === 0) return NOT_ALLOWED;
  if (policies.some((p: any) => !p.requiresApproval)) return { allowed: true, requiresApproval: false };

  const p = policies[0];
  return {
    allowed: true,
    requiresApproval: true,
    approverType: p.approverType || 'CENTER_HEAD',
    approverMemberId: p.approverMemberId,
    approverPolicyTagId: p.approverPolicyTagId,
    approverName: await approverNameFor(p),
    policyName: p.name,
  };
}

/** A Group Policy "Module Access → Edit = All" override counts as an unconditional grant (no approval). */
export async function hasModuleEditAll(user: ServerUser, moduleKey: string): Promise<boolean> {
  if (!user) return false;
  const now = new Date().toISOString();
  const policies = await readCollection<any>('groupPolicies');
  return (policies || []).some((p: any) => policyIsActive(p, now) && policyTargetsUser(p, user) && p.moduleAccess?.[moduleKey]?.edit === 'ALL' && !p.requiresApproval);
}

export type PassAction = 'issue' | 'edit' | 'delete' | 'dispatch';

const PASS_CAPS: Record<PassAction, string[]> = {
  issue: ['MANAGE_EVENT_PASSES', 'EVENTS_EDIT'],
  edit: ['EVENT_PASSES_EDIT', 'MANAGE_EVENT_PASSES', 'EVENTS_EDIT'],
  delete: ['EVENT_PASSES_DELETE', 'MANAGE_EVENT_PASSES', 'EVENTS_EDIT'],
  dispatch: ['EVENT_PASSES_DISPATCH', 'MANAGE_EVENT_PASSES', 'EVENTS_EDIT'],
};

/** Gate for an Event Passes action. Leadership / Heads / Super User are trusted; everyone else needs a policy grant. */
export async function gateEventPassAction(user: ServerUser, action: PassAction): Promise<GateDecision> {
  if (!user) return NOT_ALLOWED;
  const settings = await getAccessLevelSettingsServer();
  const builtIn = user.tier === 1 || isBaseLeadership(user, settings) || isHeadRole(user, settings) || user.tier === 2.5 || (await hasModuleEditAll(user, 'EVENT_PASSES'));
  return evaluateCapabilityGate(user, PASS_CAPS[action], builtIn);
}

/** Same rule as permissions.ts getEventApprovalRequirement, evaluated on the server. */
export async function gateEventAction(user: ServerUser, action: 'CREATE' | 'EDIT'): Promise<GateDecision> {
  if (!user) return NOT_ALLOWED;
  const settings = await getAccessLevelSettingsServer();
  const { isExecutiveRole, isCentreHead, isCoreCommitteeTier } = await import('./permissions-server');
  if (isExecutiveRole(user) && !isCentreHead(user, settings) && user.tier !== 1) {
    return { allowed: true, requiresApproval: true, approverType: 'CENTER_HEAD', approverName: 'the Centre Head or Advisor', policyName: 'Executive Event Sign-off Requirement' };
  }
  const builtIn = isBaseLeadership(user, settings) || user.tier === 2.5 || isCoreCommitteeTier(user, settings) || isHeadRole(user, settings);
  return evaluateCapabilityGate(user, [action === 'CREATE' ? 'EVENTS_CREATE' : 'EVENTS_EDIT'], builtIn);
}

/** Event fields that are approval bookkeeping or sub-records with their own workflow — never "an edit to the event". */
const EVENT_NON_EDIT_KEYS = new Set([
  'approvalStatus', 'pendingChange', 'submittedBy', 'submittedByEmail', 'approverType', 'approverMemberId', 'approverPolicyTagId',
  'approvalPolicyName', 'approverName', 'decidedBy', 'decidedAt', 'rejectionReason', 'committees',
]);
export function eventEditKeys(updates: Record<string, unknown>): string[] {
  return Object.keys(updates).filter((k) => !EVENT_NON_EDIT_KEYS.has(k));
}
