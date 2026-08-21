import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';
import { deleteStoredFile, deleteStoredFilesForRecord, saveBase64File } from '@/lib/file-storage';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    let previousStorageKey: string | undefined;
    if (typeof body.visitingCardData === 'string' && body.visitingCardData.startsWith('data:')) {
      const approxSize = Math.ceil((body.visitingCardData.length * 3) / 4);
      if (approxSize > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: 'Visiting card image exceeds the 10 MB maximum limit.' }, { status: 400 });
      }
      const stored = await saveBase64File('guests', id, 0, body.visitingCardFileName || 'card.jpg', body.visitingCardData);
      body.visitingCardUrl = stored.url;
      body.visitingCardStorageKey = stored.storageKey;
    }
    delete body.visitingCardData;
    delete body.visitingCardFileName;

    const updated = await mutateCollection('guests', (current) => {
      const idx = current.findIndex((g: any) => g.id === id);
      if (idx === -1) return [...current, { id, ...body }];
      const next = [...current];
      if (body.visitingCardStorageKey && next[idx].visitingCardStorageKey && next[idx].visitingCardStorageKey !== body.visitingCardStorageKey) {
        previousStorageKey = next[idx].visitingCardStorageKey;
      }
      next[idx] = { ...next[idx], ...body };
      return next;
    });

    if (previousStorageKey) {
      await deleteStoredFile(previousStorageKey);
    }

    const target = updated.find((g: any) => g.id === id);
    return NextResponse.json(target);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let found = false;
    await mutateCollection('guests', (current) => {
      const filtered = current.filter((g: any) => g.id !== id);
      found = filtered.length < current.length;
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await deleteStoredFilesForRecord('guests', id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
