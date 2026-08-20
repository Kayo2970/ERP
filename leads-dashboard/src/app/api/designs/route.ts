import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { saveBase64File } from '@/lib/file-storage';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function GET() {
  const items = await readCollection('designs');
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const item = await request.json();

    if (!item.title || !item.fileName || !item.fileSize) {
      return NextResponse.json({ error: 'Title, file name, and file size are required.' }, { status: 400 });
    }

    if (item.fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds the maximum limit of 25 MB.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const submittedAt = item.submittedAt || now.toISOString();
    const expiresAt = item.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const id = item.id || 'des_' + Date.now();

    const newDesign = {
      ...item,
      id,
      submittedAt,
      expiresAt,
      isExpired: false,
    };

    // Persist the uploaded asset as a real file on disk under data/uploads/ instead
    // of keeping its full base64 payload inline in designs.json.
    if (typeof newDesign.fileData === 'string' && newDesign.fileData.startsWith('data:')) {
      const stored = await saveBase64File('designs', id, 0, newDesign.fileName, newDesign.fileData);
      newDesign.fileUrl = stored.url;
      newDesign.storageKey = stored.storageKey;
      delete newDesign.fileData;
    }

    const updated = await mutateCollection('designs', (current) => {
      const idx = current.findIndex((d: any) => d.id === newDesign.id);
      if (idx >= 0) {
        current[idx] = newDesign;
        return [...current];
      }
      return [newDesign, ...current];
    });

    const created = updated.find((d: any) => d.id === newDesign.id);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
