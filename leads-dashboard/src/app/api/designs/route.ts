import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';

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

    const newDesign = {
      ...item,
      id: item.id || 'des_' + Date.now(),
      submittedAt,
      expiresAt,
      isExpired: false,
    };

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
