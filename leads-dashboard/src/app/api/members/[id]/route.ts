import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';
import { deleteStoredFile, saveBase64File } from '@/lib/file-storage';
import { requireSession } from '@/lib/session';
import { getAccessLevelSettingsServer, canEditDirectory, canTerminateMember } from '@/lib/permissions-server';
import { invalidateAllSessionsForMember } from '@/lib/session';
import { isKayomarzIdentity, countActiveSuperUsersServer, PRIVILEGED_FIELDS } from '@/lib/member-guard';
import { parseJsonBody, MemberWriteSchema } from '@/lib/validation';
import { apiError } from '@/lib/api-error';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'member';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const { id } = await params;
    const updates: any = await parseJsonBody(request, MemberWriteSchema);

    delete updates.passwordHash; // never settable through this route
    // Server-managed wallet-pass cache (see card-wallet-pass.ts) — never
    // settable through this route either. MemberWriteSchema is a passthrough
    // schema (see validation.ts), so without this a client could otherwise
    // point cardPassAppleUrl at an arbitrary storage key and have the
    // apple-pass route serve that file back as their .pkpass download.
    delete updates.cardPassSerial;
    delete updates.cardPassContentHash;
    delete updates.cardPassAppleUrl;
    delete updates.cardPassAppleStorageKey;
    delete updates.cardPassGoogleSaveUrl;

    const isSelf = actor.id === id;
    const settings = await getAccessLevelSettingsServer();
    const hasDirectoryEdit = canEditDirectory(actor, settings);
    const touchesPrivilegedField = PRIVILEGED_FIELDS.some(f => f in updates);

    if (touchesPrivilegedField && !hasDirectoryEdit) {
      return NextResponse.json({ error: "You don't have permission to change a member's tier, role, status, or department — including your own." }, { status: 403 });
    }
    if (!touchesPrivilegedField && !isSelf && !hasDirectoryEdit) {
      return NextResponse.json({ error: "You don't have permission to edit this member's record." }, { status: 403 });
    }
    if ('status' in updates && updates.status === 'Terminated' && !canTerminateMember(actor, settings)) {
      return NextResponse.json({ error: "You don't have permission to terminate members." }, { status: 403 });
    }

    // Persist a newly uploaded profile photo as a real file on disk under
    // data/uploads/, same as guests' visiting cards and design submissions —
    // never keep the raw base64 payload inline in members.json.
    if (typeof updates.avatarData === 'string' && updates.avatarData.startsWith('data:')) {
      const approxSize = Math.ceil((updates.avatarData.length * 3) / 4);
      if (approxSize > MAX_AVATAR_SIZE_BYTES) {
        return NextResponse.json({ error: 'Profile photo exceeds the 2 MB maximum limit.' }, { status: 400 });
      }
      const stored = await saveBase64File('members', id, 0, updates.avatarFileName || 'avatar.jpg', updates.avatarData);
      updates.avatarUrl = stored.url;
      updates.avatarStorageKey = stored.storageKey;
    }
    delete updates.avatarData;
    delete updates.avatarFileName;

    // Same treatment for the digital visiting card's own photo — stored under
    // a different index (1) in the member's upload folder so it never collides
    // with the avatar (index 0) saved above.
    if (typeof updates.cardPhotoData === 'string' && updates.cardPhotoData.startsWith('data:')) {
      const approxSize = Math.ceil((updates.cardPhotoData.length * 3) / 4);
      if (approxSize > MAX_AVATAR_SIZE_BYTES) {
        return NextResponse.json({ error: 'Card photo exceeds the 2 MB maximum limit.' }, { status: 400 });
      }
      const stored = await saveBase64File('members', id, 1, updates.cardPhotoFileName || 'card-photo.jpg', updates.cardPhotoData);
      updates.cardPhotoUrl = stored.url;
      updates.cardPhotoStorageKey = stored.storageKey;
    }
    delete updates.cardPhotoData;
    delete updates.cardPhotoFileName;

    let previousStorageKey: string | undefined;
    let previousCardPhotoStorageKey: string | undefined;
    // Upsert: if this id isn't in the server's collection yet (e.g. client-bundled
    // sample/seed data never POSTed), create it instead of 404ing and silently
    // dropping the edit.
    const updated = await mutateCollection('members', (current) => {
      const idx = current.findIndex((m: any) => m.id === id);
      if (idx === -1) {
        return [...current, { id, ...updates }];
      }
      const next = [...current];
      if (updates.avatarStorageKey && next[idx].avatarStorageKey && next[idx].avatarStorageKey !== updates.avatarStorageKey) {
        previousStorageKey = next[idx].avatarStorageKey;
      }
      if (updates.cardPhotoStorageKey && next[idx].cardPhotoStorageKey && next[idx].cardPhotoStorageKey !== updates.cardPhotoStorageKey) {
        previousCardPhotoStorageKey = next[idx].cardPhotoStorageKey;
      }
      const merged = { ...next[idx], ...updates };

      // First time the card is enabled, mint a stable public slug — done here
      // (inside the mutator) so it can see the full collection and dedupe
      // against every other member's slug before it's ever exposed publicly.
      if (updates.cardEnabled === true && !merged.cardSlug) {
        const base = slugifyName(merged.name || 'member');
        const taken = new Set(next.filter((m: any) => m.id !== id).map((m: any) => m.cardSlug).filter(Boolean));
        let slug = base;
        while (taken.has(slug)) {
          slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        }
        merged.cardSlug = slug;
      }

      // Invariant 1: Kayomarz Pavri ALWAYS remains a Super User (tier 1, Active)
      if (isKayomarzIdentity(next[idx]) || isKayomarzIdentity(merged)) {
        merged.tier = 1;
        if (merged.status === 'Terminated') {
          merged.status = 'Active';
        }
      }

      next[idx] = merged;

      // Invariant 2: Ensure at least one active Super User (or Kayomarz Pavri) remains
      if (countActiveSuperUsersServer(next) < 1) {
        throw new Error('Action blocked: System must always maintain at least one active Super User (or Kayomarz Pavri).');
      }

      return next;
    });

    if (previousStorageKey) {
      await deleteStoredFile(previousStorageKey);
    }
    if (previousCardPhotoStorageKey) {
      await deleteStoredFile(previousCardPhotoStorageKey);
    }

    if (updates.status === 'Terminated') {
      await invalidateAllSessionsForMember(id);
    }

    return NextResponse.json(updated.find((m: any) => m.id === id));
  } catch (err: any) {
    return apiError(err, 'members-id-api-patch', 400);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    if (!canEditDirectory(actor, settings)) {
      return NextResponse.json({ error: "You don't have permission to delete members." }, { status: 403 });
    }
    const { id } = await params;
    const force = new URL(request.url).searchParams.get('force') === 'true';
    let found = false;
    await mutateCollection('members', (current) => {
      const target = current.find((m: any) => m.id === id);
      if (!target) return current;

      if (isKayomarzIdentity(target) && !force) {
        throw new Error('The primary Super User account (Kayomarz Pavri) is protected and cannot be deleted.');
      }

      const filtered = current.filter((m: any) => m.id !== id);
      if (countActiveSuperUsersServer(filtered) < 1) {
        throw new Error('Action blocked: System must always maintain at least one active Super User (or Kayomarz Pavri).');
      }

      found = filtered.length < current.length;
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found or protected' }, { status: 404 });
    await invalidateAllSessionsForMember(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return apiError(err, 'members-id-api-delete');
  }
}
