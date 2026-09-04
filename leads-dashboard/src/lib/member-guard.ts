/**
 * member-guard.ts — invariants shared by every server route that writes to
 * the members collection (single-record and bulk alike): Kayomarz Pavri
 * always stays an active Super User, and the roster always keeps at least
 * one active Super User. Centralized here so the bulk routes can't drift
 * from the single-record ones.
 */

export function isKayomarzIdentity(m: any): boolean {
  if (!m) return false;
  const name = (m.name || '').toLowerCase();
  const email = (m.email || '').toLowerCase();
  return m.id === 'm1' || name.includes('kayomarz') || email === 'kayo2970@gmail.com' || email === 'kayo2970@outlook.com';
}

export function countActiveSuperUsersServer(members: any[]): number {
  return members.filter((m: any) =>
    (m.tier === 1 || m.role === 'Super User' || isKayomarzIdentity(m)) && m.status !== 'Terminated'
  ).length;
}

// Fields that change a member's standing/access in the system — changing any
// of these on ANYONE (including yourself) requires directory-edit access.
// passwordHash is never settable through the members routes at all
// (dedicated set-password/activation/reset routes own that).
export const PRIVILEGED_FIELDS = ['tier', 'role', 'status', 'division', 'department', 'approvalStatus', 'mustSetupPassword'];
