import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';
import { deleteStoredFile, saveBase64File } from '@/lib/file-storage';
import { requireSession, sessionErrorStatus } from '@/lib/session';
import { getAccessLevelSettingsServer, canEditDirectory, canTerminateMember } from '@/lib/permissions-server';
import { invalidateAllSessionsForMember } from '@/lib/session';
import { isKayomarzIdentity, countActiveSuperUsersServer, PRIVILEGED_FIELDS } from '@/lib/member-guard';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireSession(request);
    const { id } = await params;
    const updates = await request.json();

    delete updates.passwordHash; // never settable through this route

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

    let previousStorageKey: string | undefined;
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
      const merged = { ...next[idx], ...updates };

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

    if (updates.status === 'Terminated') {
      await invalidateAllSessionsForMember(id);
    }

    return NextResponse.json(updated.find((m: any) => m.id === id));
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 400 });
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
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message }, { status: status || 500 });
  }
}
